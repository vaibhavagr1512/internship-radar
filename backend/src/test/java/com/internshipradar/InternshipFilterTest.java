package com.internshipradar;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class InternshipFilterTest {
    @Autowired MockMvc mvc;
    @Autowired InternshipRepository internships;
    @Autowired ApplicationRepository applications;

    private void add(String title, String company, String city, String mode, String category, String suffix) {
        internships.saveAndFlush(new Internship(title, company, city, mode, category, "Third-year B.Tech",
            "https://example.com/filter/" + suffix, null, LocalDate.of(2026, 11, 12)));
    }

    @BeforeEach void setup() {
        applications.deleteAllInBatch();
        internships.deleteAll();
        add("Java Backend Intern", "Example", "Bengaluru", "HYBRID", "BACKEND", "java");
        add("React Frontend Intern", "Sample", "Remote", "REMOTE", "FRONTEND", "react");
        add("Software Engineering Intern", "JAVA Labs", "Hyderabad", "ONSITE", "SOFTWARE", "software");
        add("Java Platform Intern", "Example", "Hyderabad", "REMOTE", "BACKEND", "platform");
    }

    @ParameterizedTest
    @CsvSource({"workMode,REMOTE,2", "workMode,HYBRID,1", "roleCategory,BACKEND,2",
        "roleCategory,FRONTEND,1", "location,Hyderabad,2", "location,Bengaluru,1"})
    void filtersEachField(String parameter, String value, int count) throws Exception {
        mvc.perform(get("/api/internships").param(parameter, value)).andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(count));
    }

    @Test void combinesSearchAndAllFiltersWithAnd() throws Exception {
        mvc.perform(get("/api/internships").param("search", "java").param("workMode", "REMOTE")
            .param("roleCategory", "BACKEND").param("location", "Hyderabad"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(1))
            .andExpect(jsonPath("$[0].title").value("Java Platform Intern"));
    }

    @Test void companySearchAlsoCombinesWithFilters() throws Exception {
        mvc.perform(get("/api/internships").param("search", "java").param("workMode", "ONSITE")
            .param("roleCategory", "SOFTWARE").param("location", "Hyderabad"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(1))
            .andExpect(jsonPath("$[0].company").value("JAVA Labs"));
    }

    @Test void ignoresCaseAndSurroundingWhitespace() throws Exception {
        mvc.perform(get("/api/internships").param("search", " jAvA ").param("workMode", " hybrid ")
            .param("roleCategory", " BackEnd ").param("location", " bENGALURU "))
            .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(1));
    }

    @Test void omittedOrBlankFiltersReturnAllRecords() throws Exception {
        mvc.perform(get("/api/internships").param("search", " ").param("workMode", " ")
            .param("roleCategory", "").param("location", "  "))
            .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(4));
    }

    @Test void conflictingFiltersReturnAnEmptyArray() throws Exception {
        mvc.perform(get("/api/internships").param("workMode", "HYBRID").param("roleCategory", "FRONTEND"))
            .andExpect(status().isOk()).andExpect(content().json("[]"));
    }

    @Test void filtersMatchCompleteValuesRatherThanSubstrings() throws Exception {
        mvc.perform(get("/api/internships").param("location", "Beng"))
            .andExpect(status().isOk()).andExpect(content().json("[]"));
        mvc.perform(get("/api/internships").param("workMode", "NOT_A_MODE"))
            .andExpect(status().isOk()).andExpect(content().json("[]"));
    }

    @Test void percentUnderscoreAndBackslashRemainLiteralSearchCharacters() throws Exception {
        add("Java 100%_\\ Intern", "Literal", "Remote", "REMOTE", "BACKEND", "literal");
        mvc.perform(get("/api/internships").param("search", "%_\\").param("workMode", "REMOTE"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(1))
            .andExpect(jsonPath("$[0].company").value("Literal"));
    }

    @Test void returnsDistinctSortedDatabaseOptionsIndependentOfCurrentResults() throws Exception {
        mvc.perform(get("/api/internships/filter-options")).andExpect(status().isOk())
            .andExpect(content().json("""
                {"workModes":["HYBRID","ONSITE","REMOTE"],"roleCategories":["BACKEND","FRONTEND","SOFTWARE"],
                 "locations":["Bengaluru","Hyderabad","Remote"]}
                """, true));
    }

    @Test void optionsIncludeNewLocationsAndCategories() throws Exception {
        add("Data Intern", "New Company", "Pune", "REMOTE", "DATA", "new-location");
        mvc.perform(get("/api/internships/filter-options")).andExpect(status().isOk())
            .andExpect(jsonPath("$.locations[2]").value("Pune"))
            .andExpect(jsonPath("$.roleCategories[1]").value("DATA"));
    }

    @Test void emptyDatabaseReturnsEmptyOptionArrays() throws Exception {
        internships.deleteAllInBatch();
        mvc.perform(get("/api/internships/filter-options")).andExpect(status().isOk())
            .andExpect(content().json("{\"workModes\":[],\"roleCategories\":[],\"locations\":[]}"));
    }
}
