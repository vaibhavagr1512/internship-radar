package com.internshipradar;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Set;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class EligibilityApiTest {
    @Autowired MockMvc mvc;
    @Autowired InternshipRepository internships;
    @Autowired ApplicationRepository applications;

    private void add(String title, Set<Degree> degrees, Set<Integer> years, BigDecimal minimum, boolean verified) {
        Internship row = new Internship(title, "Example", "Remote", "REMOTE", "BACKEND", "Recorded criteria",
            "https://example.com/eligibility/"+title, null, LocalDate.of(2026,11,12));
        row.configureEligibility(degrees,years,minimum,verified);internships.saveAndFlush(row);
    }
    @BeforeEach void setup() {
        applications.deleteAllInBatch();internships.deleteAll();
        add("Java",Set.of(Degree.BTECH),Set.of(3),new BigDecimal("7.00"),true);
        add("React",Set.of(Degree.BTECH,Degree.BE),Set.of(2,3,4),null,true);
        add("Unknown",Set.of(),Set.of(),null,false);
    }
    private MockHttpServletRequestBuilder profile() {
        return get("/api/internships").with(request -> {
            if (request.getParameter("page") == null) request.setParameter("page", "0");
            if (request.getParameter("studentDegree") == null) request.setParameter("studentDegree", "BTECH");
            if (request.getParameter("studentYear") == null) request.setParameter("studentYear", "3");
            if (request.getParameter("studentCgpa") == null) request.setParameter("studentCgpa", "8.50");
            return request;
        });
    }
    @Test void evaluatesMatchingAndUnknownRecordsWithoutHidingThem() throws Exception {
        mvc.perform(profile()).andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(3))
            .andExpect(jsonPath("$.content[0].eligibility.status").value("MATCHES"))
            .andExpect(jsonPath("$.content[1].eligibility.status").value("MATCHES"))
            .andExpect(jsonPath("$.content[2].eligibility.status").value("CHECK_OFFICIAL"));
    }
    @Test void matchesOnlyFiltersInDatabaseBeforePagination() throws Exception {
        mvc.perform(profile().param("matchesOnly","true").param("size","1").param("page","1"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(2))
            .andExpect(jsonPath("$.totalPages").value(2)).andExpect(jsonPath("$.content[0].title").value("React"));
    }
    @Test void cgpaAtBoundaryMatchesAndBelowDoesNot() throws Exception {
        mvc.perform(profile().param("studentCgpa","7.00")).andExpect(status().isOk())
            .andExpect(jsonPath("$.content[0].eligibility.status").value("MATCHES"));
        mvc.perform(profile().param("studentCgpa","6.99")).andExpect(status().isOk())
            .andExpect(jsonPath("$.content[0].eligibility.status").value("DOES_NOT_MATCH"))
            .andExpect(jsonPath("$.content[1].eligibility.status").value("MATCHES"));
    }
    @Test void rejectsWrongDegreeAndStudyYear() throws Exception {
        mvc.perform(profile().param("studentDegree","BE")).andExpect(status().isOk())
            .andExpect(jsonPath("$.content[0].eligibility.status").value("DOES_NOT_MATCH"))
            .andExpect(jsonPath("$.content[1].eligibility.status").value("MATCHES"));
        mvc.perform(profile().param("studentYear","1").param("matchesOnly","true"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(0));
    }
    @Test void unverifiedOrIncompleteRequirementsNeverMatch() throws Exception {
        add("Unverified",Set.of(Degree.BTECH),Set.of(3),null,false);
        add("MissingYear",Set.of(Degree.BTECH),Set.of(),null,true);
        mvc.perform(profile().param("matchesOnly","true")).andExpect(status().isOk())
            .andExpect(jsonPath("$.totalElements").value(2));
        mvc.perform(profile().param("size","10")).andExpect(status().isOk())
            .andExpect(jsonPath("$.content[3].eligibility.status").value("CHECK_OFFICIAL"))
            .andExpect(jsonPath("$.content[4].eligibility.status").value("CHECK_OFFICIAL"));
    }
    @Test void searchAndExistingFiltersCombineWithMatchesOnly() throws Exception {
        mvc.perform(profile().param("matchesOnly","true").param("search","React").param("workMode","REMOTE").param("roleCategory","BACKEND").param("location","Remote"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(1));
    }
    @Test void partialProfileAndMatchingWithoutProfileReturn400() throws Exception {
        mvc.perform(get("/api/internships").param("studentDegree","BTECH")).andExpect(status().isBadRequest());
        mvc.perform(get("/api/internships").param("matchesOnly","true")).andExpect(status().isBadRequest());
    }
    @ParameterizedTest @ValueSource(strings={"-1","10.01","8.123"})
    void invalidCgpaReturns400(String value) throws Exception { mvc.perform(profile().param("studentCgpa",value)).andExpect(status().isBadRequest()); }
    @ParameterizedTest @ValueSource(strings={"0","7"})
    void invalidYearReturns400(String value) throws Exception { mvc.perform(profile().param("studentYear",value)).andExpect(status().isBadRequest()); }
    @Test void unknownDegreeReturns400AndLowercaseIsAccepted() throws Exception {
        mvc.perform(profile().param("studentDegree","not-a-degree")).andExpect(status().isBadRequest());
        mvc.perform(profile().param("studentDegree"," btech ")).andExpect(status().isOk());
    }
    @Test void legacyArrayAndUnassessedPageRemainCompatible() throws Exception {
        mvc.perform(get("/api/internships")).andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(3))
            .andExpect(jsonPath("$[0].eligibleDegrees").doesNotExist());
        mvc.perform(get("/api/internships").param("page","0")).andExpect(status().isOk())
            .andExpect(jsonPath("$.content[0].eligibility").doesNotExist());
    }
}
