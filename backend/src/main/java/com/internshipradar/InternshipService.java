package com.internshipradar;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import java.util.List;
@Service
@Transactional(readOnly = true)
public class InternshipService {
    private final InternshipRepository repository;
    public InternshipService(InternshipRepository repository) { this.repository = repository; }
    public List<Internship> findAll(String search) {
        if (search == null || search.isBlank()) return repository.findAllByOrderByIdAsc();
        String term = search.strip();
        return repository.findByTitleContainingIgnoreCaseOrCompanyContainingIgnoreCaseOrderByIdAsc(term, term);
    }
    public Internship findById(Long id) {
        return repository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Internship not found"));
    }
}
