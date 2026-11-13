package com.internshipradar;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;
import java.time.LocalDate;

@Service
@Transactional(readOnly = true)
public class ApplicationService {
    private final ApplicationRepository applications;
    private final InternshipRepository internships;

    public ApplicationService(ApplicationRepository applications, InternshipRepository internships) {
        this.applications = applications;
        this.internships = internships;
    }

    public List<ApplicationResponse> list(ApplicationStatus status) {
        var records = status == null ? applications.findAllByOrderBySavedAtDescIdDesc()
            : applications.findByStatusOrderBySavedAtDescIdDesc(status);
        return records.stream().map(ApplicationResponse::from).toList();
    }

    public ApplicationResponse find(Long id) {
        return ApplicationResponse.from(requireApplication(id));
    }

    @Transactional
    public ApplicationResponse save(Long internshipId) {
        if (internshipId == null || internshipId <= 0)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A positive internshipId is required");
        Internship internship = internships.findById(internshipId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Internship not found"));
        if (applications.existsByInternshipId(internshipId))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Internship is already tracked");
        try {
            return ApplicationResponse.from(applications.saveAndFlush(new TrackedApplication(internship)));
        } catch (DataIntegrityViolationException duplicate) {
            // The unique database constraint also protects concurrent save requests.
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Internship is already tracked", duplicate);
        }
    }

    @Transactional
    public ApplicationResponse updateStatus(Long id, ApplicationStatus status) {
        if (status == null)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A valid status is required");
        TrackedApplication application = requireApplication(id);
        application.updateStatus(status);
        applications.flush();
        return ApplicationResponse.from(application);
    }

    @Transactional
    public ApplicationResponse updateDetails(Long id, String notes, LocalDate appliedDate) {
        String text = notes == null ? "" : notes;
        if (text.length() > 2000)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Notes must contain at most 2000 characters");
        if (appliedDate != null && (appliedDate.getYear() < 1000 || appliedDate.getYear() > 9999))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Applied date must be between years 1000 and 9999");
        TrackedApplication application = requireApplication(id);
        application.updateDetails(text, appliedDate);
        applications.flush();
        return ApplicationResponse.from(application);
    }

    @Transactional
    public void remove(Long id) {
        applications.delete(requireApplication(id));
        applications.flush();
    }

    private TrackedApplication requireApplication(Long id) {
        return applications.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Application not found"));
    }
}
