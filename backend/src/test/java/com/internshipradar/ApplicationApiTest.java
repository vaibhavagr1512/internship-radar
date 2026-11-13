package com.internshipradar;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class ApplicationApiTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;
    @Autowired InternshipRepository internships;
    @Autowired ApplicationRepository applications;
    private Internship internship;

    @BeforeEach void setup() {
        applications.deleteAllInBatch();
        internships.deleteAll();
        internship = internships.saveAndFlush(new Internship("[DEMO] Java Intern", "[DEMO] Example",
            "Remote", "REMOTE", "BACKEND", "Third-year B.Tech", "https://example.com/tracker-test",
            null, LocalDate.of(2026, 11, 12)));
    }

    private JsonNode save() throws Exception {
        return mapper.readTree(mvc.perform(post("/api/applications").contentType(MediaType.APPLICATION_JSON)
            .content("{\"internshipId\":" + internship.getId() + "}"))
            .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString());
    }

    @Test void savesWithDefaultStatusAndTimestamps() throws Exception {
        JsonNode created = save();
        assertThat(created.get("status").asText()).isEqualTo("SAVED");
        assertThat(created.get("savedAt").asText()).isNotBlank();
        assertThat(created.get("updatedAt").asText()).isNotBlank();
        assertThat(created.get("internship").get("id").asLong()).isEqualTo(internship.getId());
        assertThat(applications.count()).isEqualTo(1);
        mvc.perform(get("/api/applications/{id}", created.get("id").asLong()))
            .andExpect(status().isOk()).andExpect(jsonPath("$.internship.title").value("[DEMO] Java Intern"));
    }

    @Test void returnsResolvableLocationHeader() throws Exception {
        String location = mvc.perform(post("/api/applications").contentType(MediaType.APPLICATION_JSON)
            .content("{\"internshipId\":" + internship.getId() + "}"))
            .andExpect(status().isCreated()).andReturn().getResponse().getHeader("Location");
        assertThat(location).startsWith("/api/applications/");
        mvc.perform(get(location)).andExpect(status().isOk());
    }

    @Test void listsSavedApplicationsAndFiltersStatus() throws Exception {
        JsonNode saved = save();
        mvc.perform(get("/api/applications")).andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(1));
        mvc.perform(get("/api/applications").param("status", "APPLIED"))
            .andExpect(status().isOk()).andExpect(content().json("[]"));
        mvc.perform(patch("/api/applications/{id}", saved.get("id").asLong())
            .contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"APPLIED\"}"))
            .andExpect(status().isOk());
        mvc.perform(get("/api/applications").param("status", "APPLIED"))
            .andExpect(status().isOk()).andExpect(jsonPath("$[0].status").value("APPLIED"));
        mvc.perform(get("/api/applications").param("status", "SAVED"))
            .andExpect(status().isOk()).andExpect(content().json("[]"));
    }

    @ParameterizedTest
    @EnumSource(ApplicationStatus.class)
    void persistsEverySupportedStatus(ApplicationStatus status) throws Exception {
        long id = save().get("id").asLong();
        mvc.perform(patch("/api/applications/{id}", id).contentType(MediaType.APPLICATION_JSON)
            .content("{\"status\":\"" + status + "\"}"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.status").value(status.name()));
        assertThat(applications.findById(id).orElseThrow().getStatus()).isEqualTo(status);
    }

    @Test void duplicateSaveReturnsConflict() throws Exception {
        save();
        mvc.perform(post("/api/applications").contentType(MediaType.APPLICATION_JSON)
            .content("{\"internshipId\":" + internship.getId() + "}"))
            .andExpect(status().isConflict());
        assertThat(applications.count()).isEqualTo(1);
    }

    @Test void databaseAlsoRejectsDuplicates() throws Exception {
        save();
        assertThatThrownBy(() -> applications.saveAndFlush(new TrackedApplication(internship)))
            .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test void removesTrackingAndAllowsSavingAgain() throws Exception {
        long id = save().get("id").asLong();
        mvc.perform(delete("/api/applications/{id}", id)).andExpect(status().isNoContent());
        mvc.perform(get("/api/applications/{id}", id)).andExpect(status().isNotFound());
        assertThat(internships.existsById(internship.getId())).isTrue();
        save();
        assertThat(applications.count()).isEqualTo(1);
    }

    @Test void unknownInternshipReturns404() throws Exception {
        mvc.perform(post("/api/applications").contentType(MediaType.APPLICATION_JSON)
            .content("{\"internshipId\":9223372036854775807}"))
            .andExpect(status().isNotFound());
    }

    @Test void unknownApplicationReturns404ForAllOperations() throws Exception {
        String missing = "/api/applications/9223372036854775807";
        mvc.perform(get(missing)).andExpect(status().isNotFound());
        mvc.perform(patch(missing).contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"APPLIED\"}"))
            .andExpect(status().isNotFound());
        mvc.perform(delete(missing)).andExpect(status().isNotFound());
    }

    @Test void fractionalInternshipIdReturns400InsteadOfBeingTruncated() throws Exception {
        mvc.perform(post("/api/applications").contentType(MediaType.APPLICATION_JSON)
            .content("{\"internshipId\":" + internship.getId() + ".5}"))
            .andExpect(status().isBadRequest());
        assertThat(applications.count()).isZero();
    }

    @Test void missingOrNonpositiveInternshipIdReturns400() throws Exception {
        for (String body : new String[]{"{}", "{\"internshipId\":null}", "{\"internshipId\":0}", "{\"internshipId\":-1}"})
            mvc.perform(post("/api/applications").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest());
    }

    @Test void missingOrUnknownStatusReturns400WithoutChangingSavedStatus() throws Exception {
        long id = save().get("id").asLong();
        for (String body : new String[]{"{}", "{\"status\":null}", "{\"status\":\"UNKNOWN\"}"})
            mvc.perform(patch("/api/applications/{id}", id).contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest());
        assertThat(applications.findById(id).orElseThrow().getStatus()).isEqualTo(ApplicationStatus.SAVED);
    }

    @Test void invalidFilterReturns400() throws Exception {
        mvc.perform(get("/api/applications").param("status", "UNKNOWN")).andExpect(status().isBadRequest());
    }

    @Test void emptyTrackerReturnsAnEmptyArray() throws Exception {
        mvc.perform(get("/api/applications")).andExpect(status().isOk()).andExpect(content().json("[]"));
    }
}
