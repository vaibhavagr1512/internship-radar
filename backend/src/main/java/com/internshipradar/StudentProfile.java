package com.internshipradar;

import java.math.BigDecimal;
import java.util.Locale;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

public record StudentProfile(Degree degree, int studyYear, BigDecimal cgpa) {
    public static StudentProfile parse(String degree, Integer year, BigDecimal cgpa, boolean matchesOnly) {
        if (degree == null && year == null && cgpa == null && !matchesOnly) return null;
        if (degree == null || degree.isBlank() || year == null || cgpa == null)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Degree, study year and CGPA are required together");
        if (year < 1 || year > 6 || cgpa.compareTo(BigDecimal.ZERO) < 0 || cgpa.compareTo(BigDecimal.TEN) > 0 || cgpa.stripTrailingZeros().scale() > 2)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Study year must be 1–6 and CGPA must be 0–10 with at most two decimal places");
        try { return new StudentProfile(Degree.valueOf(degree.strip().toUpperCase(Locale.ROOT)), year, cgpa); }
        catch (IllegalArgumentException invalid) { throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown degree code"); }
    }
}
