package com.internshipradar;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import java.time.LocalDate;
import java.util.UUID;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/** No surrounding test transaction: serialization must work after service transactions close. */
@SpringBootTest
@AutoConfigureMockMvc
class ApplicationSerializationTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;
    @Autowired InternshipRepository internships;
    @Autowired ApplicationRepository applications;

    @Test void serializesNestedInternshipAfterCommittedSaveReadAndUpdate() throws Exception {
        Internship internship = internships.saveAndFlush(new Internship("Serialization Test", "Test Company",
            "Remote", "REMOTE", "BACKEND", "Test fixture only",
            "https://example.com/test/" + UUID.randomUUID(), null, LocalDate.of(2026, 11, 12)));
        try {
            String body = mvc.perform(post("/api/applications").contentType(MediaType.APPLICATION_JSON)
                .content("{\"internshipId\":" + internship.getId() + "}"))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.internship.title").value("Serialization Test"))
                .andReturn().getResponse().getContentAsString();
            long id = mapper.readTree(body).get("id").asLong();
            mvc.perform(get("/api/applications/{id}", id)).andExpect(status().isOk())
                .andExpect(jsonPath("$.internship.company").value("Test Company"));
            mvc.perform(get("/api/applications")).andExpect(status().isOk());
            mvc.perform(patch("/api/applications/{id}", id).contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\":\"INTERVIEW\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("INTERVIEW"))
                .andExpect(jsonPath("$.internship.applicationUrl").value(internship.getApplicationUrl()));
        } finally {
            for (TrackedApplication application : applications.findAllByOrderBySavedAtDescIdDesc()) {
                if (application.getInternship().getId().equals(internship.getId()))
                    applications.deleteById(application.getId());
            }
            internships.deleteById(internship.getId());
        }
    }
}
