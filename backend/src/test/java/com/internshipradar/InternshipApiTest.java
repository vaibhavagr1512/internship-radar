package com.internshipradar;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class InternshipApiTest {
    @Autowired MockMvc mvc;
    @Autowired InternshipRepository repository;
    @Autowired ApplicationRepository applications;
    private Long javaId;
    private Internship sample(String title, String company, String url) {
        return new Internship(title, company, "Remote", "REMOTE", "BACKEND",
            "Third-year B.Tech", url, null, LocalDate.of(2026, 11, 12));
    }
    @BeforeEach void setup() {
        applications.deleteAllInBatch();
        repository.deleteAll();
        javaId = repository.saveAndFlush(sample("Java Backend Intern", "Example", "https://example.com/java")).getId();
        repository.saveAndFlush(sample("Software Intern", "JAVA Labs", "https://example.com/software"));
        repository.saveAndFlush(sample("React Intern", "Sample", "https://example.com/react"));
    }
    @Test void listsDatabaseRecords() throws Exception {
        mvc.perform(get("/api/internships")).andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(3))
            .andExpect(jsonPath("$[0].title").value("Java Backend Intern"));
    }
    @Test void findsRecordWithAllPublicFields() throws Exception {
        mvc.perform(get("/api/internships/{id}", javaId)).andExpect(status().isOk())
            .andExpect(jsonPath("$.company").value("Example"))
            .andExpect(jsonPath("$.location").value("Remote"))
            .andExpect(jsonPath("$.workMode").value("REMOTE"))
            .andExpect(jsonPath("$.roleCategory").value("BACKEND"))
            .andExpect(jsonPath("$.eligibilityText").value("Third-year B.Tech"))
            .andExpect(jsonPath("$.applicationUrl").value("https://example.com/java"))
            .andExpect(jsonPath("$.deadline").isEmpty())
            .andExpect(jsonPath("$.lastVerifiedDate").value("2026-11-12"))
            .andExpect(jsonPath("$.normalizedApplicationUrl").doesNotExist());
    }
    @Test void unknownIdReturns404() throws Exception {
        mvc.perform(get("/api/internships/9223372036854775807")).andExpect(status().isNotFound());
    }
    @Test void searchesTitleOrCompanyIgnoringCase() throws Exception {
        mvc.perform(get("/api/internships").param("search", "  jAvA  "))
            .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(2));
    }
    @Test void noMatchReturnsEmptyList() throws Exception {
        mvc.perform(get("/api/internships").param("search", "missing"))
            .andExpect(status().isOk()).andExpect(content().json("[]"));
    }
    @Test void blankSearchReturnsAll() throws Exception {
        mvc.perform(get("/api/internships").param("search", " "))
            .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(3));
    }
    @Test void searchTreatsWildcardAsLiteral() throws Exception {
        mvc.perform(get("/api/internships").param("search", "%"))
            .andExpect(status().isOk()).andExpect(content().json("[]"));
    }
    @Test void serializesOptionalDeadlineWhenPresent() throws Exception {
        Internship dated = repository.saveAndFlush(new Internship("Dated", "Example", "Remote", "REMOTE", "BACKEND",
            "Third-year B.Tech", "https://example.com/dated", LocalDate.of(2026, 12, 31), LocalDate.of(2026, 11, 12)));
        mvc.perform(get("/api/internships/{id}", dated.getId()))
            .andExpect(status().isOk()).andExpect(jsonPath("$.deadline").value("2026-12-31"));
    }
    @Test void databasePreservesUrlPathCase() {
        repository.saveAndFlush(sample("Distinct", "Other", "https://example.com/Java"));
        assertThat(repository.count()).isEqualTo(4);
    }
    @Test void duplicateNormalizedUrlRejectedByDatabase() {
        assertThatThrownBy(() -> repository.saveAndFlush(sample("Duplicate", "Other",
            "  HTTPS://EXAMPLE.COM:443/java#apply  ")))
            .isInstanceOf(DataIntegrityViolationException.class);
    }
}
