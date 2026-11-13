package com.internshipradar;

import java.time.LocalDate;

public record AssessedInternship(Long id, String title, String company, String location, String workMode,
                                String roleCategory, String eligibilityText, String applicationUrl,
                                LocalDate deadline, LocalDate lastVerifiedDate, EligibilityAssessment eligibility) {
    public static AssessedInternship from(Internship internship, StudentProfile profile) {
        return new AssessedInternship(internship.getId(), internship.getTitle(), internship.getCompany(), internship.getLocation(),
            internship.getWorkMode(), internship.getRoleCategory(), internship.getEligibilityText(), internship.getApplicationUrl(),
            internship.getDeadline(), internship.getLastVerifiedDate(), EligibilityAssessment.evaluate(internship, profile));
    }
}
