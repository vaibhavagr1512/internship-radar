package com.internshipradar;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class InternshipPaginationTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;
    @Autowired InternshipRepository internships;
    @Autowired ApplicationRepository applications;

    @BeforeEach void setup() {
        applications.deleteAllInBatch();
        internships.deleteAll();
        for (int n = 1; n <= 8; n++) {
            internships.saveAndFlush(new Internship("Java Intern " + n, "Example " + n, "Pune",
                n % 2 == 0 ? "REMOTE" : "HYBRID", "BACKEND", "Third-year B.Tech",
                "https://example.com/page/" + n, n <= 6 ? LocalDate.of(2026, 12, n) : null,
                LocalDate.of(2026, 11, n)));
        }
    }

    @Test void returnsFirstPageAndCorrectMetadata() throws Exception {
        mvc.perform(get("/api/internships").param("page", "0"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.content.length()").value(6))
            .andExpect(jsonPath("$.page").value(0)).andExpect(jsonPath("$.size").value(6))
            .andExpect(jsonPath("$.totalElements").value(8)).andExpect(jsonPath("$.totalPages").value(2))
            .andExpect(jsonPath("$.first").value(true)).andExpect(jsonPath("$.last").value(false))
            .andExpect(jsonPath("$.content[0].title").value("Java Intern 8"));
    }

    @Test void returnsLastPartialPage() throws Exception {
        mvc.perform(get("/api/internships").param("page", "1").param("size", "6"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.content.length()").value(2))
            .andExpect(jsonPath("$.first").value(false)).andExpect(jsonPath("$.last").value(true))
            .andExpect(jsonPath("$.content[0].title").value("Java Intern 2"));
    }

    @Test void outOfRangePageReturnsEmptyContentAndKeepsTotal() throws Exception {
        mvc.perform(get("/api/internships").param("page", "10").param("size", "6"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.content").isEmpty())
            .andExpect(jsonPath("$.totalElements").value(8)).andExpect(jsonPath("$.totalPages").value(2));
    }

    @ParameterizedTest
    @ValueSource(strings = {"deadline,asc", "deadline,desc"})
    void deadlinesWithoutDatesAlwaysSortLast(String sort) throws Exception {
        String response = mvc.perform(get("/api/internships").param("page", "0").param("size", "8").param("sort", sort))
            .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        var content = mapper.readTree(response).get("content");
        assertThat(content.get(6).get("deadline").isNull()).isTrue();
        assertThat(content.get(7).get("deadline").isNull()).isTrue();
        assertThat(content.get(0).get("title").asText()).isEqualTo(sort.endsWith("asc") ? "Java Intern 1" : "Java Intern 6");
    }

    @Test void verificationDatesSortAscending() throws Exception {
        mvc.perform(get("/api/internships").param("page", "0").param("sort", "lastVerifiedDate,asc"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.content[0].title").value("Java Intern 1"));
    }

    @Test void combinedFiltersAreAppliedBeforeCountingAndPaging() throws Exception {
        mvc.perform(get("/api/internships").param("page", "1").param("size", "2").param("search", "java")
            .param("workMode", "remote").param("roleCategory", "BACKEND").param("location", "Pune"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(4))
            .andExpect(jsonPath("$.totalPages").value(2)).andExpect(jsonPath("$.content.length()").value(2))
            .andExpect(jsonPath("$.content[0].title").value("Java Intern 4"));
    }

    @Test void emptyResultsHaveZeroPages() throws Exception {
        mvc.perform(get("/api/internships").param("page", "0").param("search", "missing"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.content").isEmpty())
            .andExpect(jsonPath("$.totalElements").value(0)).andExpect(jsonPath("$.totalPages").value(0));
    }

    @Test void equalDatesHaveStableIdOrderAcrossPages() throws Exception {
        internships.deleteAllInBatch();
        for (int n = 1; n <= 5; n++) internships.saveAndFlush(new Internship("Tie " + n, "Example", "Remote", "REMOTE", "BACKEND",
            "Third-year B.Tech", "https://example.com/tie/" + n, null, LocalDate.of(2026, 11, 1)));
        for (int page = 0; page < 3; page++) {
            mvc.perform(get("/api/internships").param("page", String.valueOf(page)).param("size", "2").param("sort", "deadline,asc"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.content[0].title").value("Tie " + (page * 2 + 1)));
        }
    }

    @ParameterizedTest
    @ValueSource(strings = {"-1", "1000001", "1.5", "abc"})
    void invalidPagesReturn400(String value) throws Exception {
        mvc.perform(get("/api/internships").param("page", value)).andExpect(status().isBadRequest());
    }

    @ParameterizedTest
    @ValueSource(strings = {"0", "-1", "51", "1.5", "abc"})
    void invalidSizesReturn400(String value) throws Exception {
        mvc.perform(get("/api/internships").param("size", value)).andExpect(status().isBadRequest());
    }

    @ParameterizedTest
    @ValueSource(strings = {"title,asc", "deadline,up", "company,desc", "deadline,asc,id", ""})
    void invalidSortsReturn400(String value) throws Exception {
        mvc.perform(get("/api/internships").param("sort", value)).andExpect(status().isBadRequest());
    }

    @Test void legacyArrayAndFilterOptionsRemainCompatible() throws Exception {
        mvc.perform(get("/api/internships")).andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(8));
        mvc.perform(get("/api/internships/filter-options")).andExpect(status().isOk())
            .andExpect(jsonPath("$.locations[0]").value("Pune"));
    }
}
