package com.internshipradar;

import java.time.Instant;
import java.time.LocalDate;

/** Maps lazy JPA associations inside the service transaction, before JSON serialization. */
public record ApplicationResponse(Long id, InternshipDetails internship, ApplicationStatus status,
                                  Instant savedAt, Instant updatedAt, String notes, LocalDate appliedDate) {
    static ApplicationResponse from(TrackedApplication application) {
        return new ApplicationResponse(application.getId(), InternshipDetails.from(application.getInternship()),
            application.getStatus(), application.getSavedAt(), application.getUpdatedAt(), application.getNotes(), application.getAppliedDate());
    }

    public record InternshipDetails(Long id, String title, String company, String location,
                                    String workMode, String roleCategory, String eligibilityText,
                                    String applicationUrl, LocalDate deadline, LocalDate lastVerifiedDate) {
        static InternshipDetails from(Internship internship) {
            return new InternshipDetails(internship.getId(), internship.getTitle(), internship.getCompany(),
                internship.getLocation(), internship.getWorkMode(), internship.getRoleCategory(),
                internship.getEligibilityText(), internship.getApplicationUrl(), internship.getDeadline(),
                internship.getLastVerifiedDate());
        }
    }
}
