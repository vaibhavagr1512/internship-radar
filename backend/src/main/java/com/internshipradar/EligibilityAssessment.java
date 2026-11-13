package com.internshipradar;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public record EligibilityAssessment(Status status, List<String> reasons, List<Degree> degrees,
                                    List<Integer> studyYears, BigDecimal minimumCgpa, boolean verified) {
    public enum Status { MATCHES, DOES_NOT_MATCH, CHECK_OFFICIAL }

    public static EligibilityAssessment evaluate(Internship internship, StudentProfile profile) {
        List<Degree> degrees = internship.getEligibleDegrees().stream().sorted().toList();
        List<Integer> years = internship.getEligibleStudyYears().stream().sorted().toList();
        BigDecimal minimum = internship.getMinimumCgpa();
        if (!internship.isEligibilityVerified() || degrees.isEmpty() || years.isEmpty())
            return new EligibilityAssessment(Status.CHECK_OFFICIAL, List.of("Complete structured requirements have not been verified. Check the official listing."), degrees, years, minimum, internship.isEligibilityVerified());
        List<String> reasons = new ArrayList<>();
        if (!degrees.contains(profile.degree())) reasons.add("Your degree does not match the recorded degree requirement.");
        if (!years.contains(profile.studyYear())) reasons.add("Your study year does not match the recorded year requirement.");
        if (minimum != null && profile.cgpa().compareTo(minimum) < 0) reasons.add("Your CGPA is below the recorded minimum of " + minimum.toPlainString() + ".");
        Status status = reasons.isEmpty() ? Status.MATCHES : Status.DOES_NOT_MATCH;
        if (reasons.isEmpty()) reasons.add("You match the recorded degree, year and CGPA criteria. Confirm all conditions on the official listing.");
        return new EligibilityAssessment(status, List.copyOf(reasons), degrees, years, minimum, true);
    }
}
