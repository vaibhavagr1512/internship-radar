package com.internshipradar;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.util.Map;
import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class ApplicationDetailsTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;
    @Autowired InternshipRepository internships;
    @Autowired ApplicationRepository applications;
    private Long id;

    @BeforeEach void setup() {
        applications.deleteAllInBatch();
        internships.deleteAll();
        Internship internship = internships.saveAndFlush(new Internship("Java Intern", "Example", "Remote", "REMOTE",
            "BACKEND", "Third-year B.Tech", "https://example.com/day7", null, LocalDate.of(2026, 11, 12)));
        id = applications.saveAndFlush(new TrackedApplication(internship)).getId();
    }
    private void update(String notes, String date) throws Exception {
        String body = mapper.writeValueAsString(Map.of("notes", notes, "appliedDate", date));
        mvc.perform(put("/api/applications/{id}/details", id).contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isOk());
    }
    @Test void newApplicationHasEmptyNotesAndNoAppliedDate() throws Exception {
        mvc.perform(get("/api/applications/{id}", id)).andExpect(status().isOk())
            .andExpect(jsonPath("$.notes").value("")).andExpect(jsonPath("$.appliedDate").isEmpty());
    }
    @Test void savesAndReadsDetailsWithoutChangingStatus() throws Exception {
        update("Follow up next week", "2026-11-13");
        mvc.perform(get("/api/applications/{id}", id)).andExpect(status().isOk())
            .andExpect(jsonPath("$.notes").value("Follow up next week"))
            .andExpect(jsonPath("$.appliedDate").value("2026-11-13"))
            .andExpect(jsonPath("$.status").value("SAVED"));
        assertThat(applications.findById(id).orElseThrow().getAppliedDate()).isEqualTo(LocalDate.of(2026, 11, 13));
    }
    @Test void statusUpdatesPreserveTheDetails() throws Exception {
        update("Interview preparation", "2026-11-12");
        mvc.perform(patch("/api/applications/{id}", id).contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"APPLIED\"}"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.notes").value("Interview preparation"))
            .andExpect(jsonPath("$.appliedDate").value("2026-11-12"));
    }
    @Test void clearingDetailsDoesNotResetStatus() throws Exception {
        update("Some notes", "2026-11-12");
        mvc.perform(patch("/api/applications/{id}", id).contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"INTERVIEW\"}"))
            .andExpect(status().isOk());
        mvc.perform(put("/api/applications/{id}/details", id).contentType(MediaType.APPLICATION_JSON).content("{\"notes\":\"\",\"appliedDate\":null}"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.notes").value(""))
            .andExpect(jsonPath("$.appliedDate").isEmpty()).andExpect(jsonPath("$.status").value("INTERVIEW"));
    }
    @Test void nullNotesAreStoredAsEmptyText() throws Exception {
        mvc.perform(put("/api/applications/{id}/details", id).contentType(MediaType.APPLICATION_JSON).content("{\"notes\":null,\"appliedDate\":null}"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.notes").value(""));
    }
    @Test void acceptsTheMaximumNotesLength() throws Exception { update("a".repeat(2000), "2026-11-13"); }
    @Test void rejectsLongNotesAndPreservesExistingDetails() throws Exception {
        update("Keep these notes", "2026-11-12");
        mvc.perform(put("/api/applications/{id}/details", id).contentType(MediaType.APPLICATION_JSON)
            .content(mapper.writeValueAsString(Map.of("notes", "a".repeat(2001), "appliedDate", "2026-11-13"))))
            .andExpect(status().isBadRequest());
        assertThat(applications.findById(id).orElseThrow().getNotes()).isEqualTo("Keep these notes");
    }
    @Test void rejectsInvalidDateSyntaxWithoutSavingNotes() throws Exception {
        mvc.perform(put("/api/applications/{id}/details", id).contentType(MediaType.APPLICATION_JSON)
            .content("{\"notes\":\"Not saved\",\"appliedDate\":\"13/11/2026\"}"))
            .andExpect(status().isBadRequest());
        assertThat(applications.findById(id).orElseThrow().getNotes()).isEmpty();
    }
    @Test void rejectsDatesOutsideTheMysqlRange() throws Exception {
        for (String date : new String[]{"0001-01-01", "+10000-01-01"})
            mvc.perform(put("/api/applications/{id}/details", id).contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of("notes", "Invalid date", "appliedDate", date))))
                .andExpect(status().isBadRequest());
        assertThat(applications.findById(id).orElseThrow().getNotes()).isEmpty();
    }

    @Test void unknownApplicationReturns404() throws Exception {
        mvc.perform(put("/api/applications/9223372036854775807/details").contentType(MediaType.APPLICATION_JSON)
            .content("{\"notes\":\"Some notes\",\"appliedDate\":null}"))
            .andExpect(status().isNotFound());
    }
    @Test void preservesMultilineUnicodeAndHtmlAsPlainText() throws Exception {
        String notes = "First line\nFollow-up: नमस्ते <script>alert('demo')</script>";
        update(notes, "2026-11-13");
        mvc.perform(get("/api/applications/{id}", id)).andExpect(status().isOk()).andExpect(jsonPath("$.notes").value(notes));
    }
    @Test void preservesSavedAtAndUpdatesUpdatedAt() throws Exception {
        var before = applications.findById(id).orElseThrow();
        var saved = before.getSavedAt();var updated = before.getUpdatedAt();
        update("Changed", "2026-11-13");
        var after = applications.findById(id).orElseThrow();
        assertThat(after.getSavedAt()).isEqualTo(saved);
        assertThat(after.getUpdatedAt()).isAfterOrEqualTo(updated);
    }
}
