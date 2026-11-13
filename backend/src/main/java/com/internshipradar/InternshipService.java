package com.internshipradar;

import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.TreeSet;

@Service
@Transactional(readOnly = true)
public class InternshipService {
    private final InternshipRepository repository;

    public InternshipService(InternshipRepository repository) { this.repository = repository; }

    public List<Internship> findAll(String search, String workMode, String roleCategory, String location) {
        String term = normalize(search);
        String mode = normalize(workMode);
        String category = normalize(roleCategory);
        String city = normalize(location);

        return repository.findAll((root, query, cb) -> {
            List<Predicate> conditions = new ArrayList<>();
            if (!term.isEmpty()) {
                // Search is literal text: SQL wildcard characters must not broaden matches.
                String pattern = "%" + term.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%";
                conditions.add(cb.or(cb.like(cb.lower(root.get("title")), pattern, '\\'),
                    cb.like(cb.lower(root.get("company")), pattern, '\\')));
            }
            if (!mode.isEmpty()) conditions.add(cb.equal(cb.lower(cb.trim(root.get("workMode"))), mode));
            if (!category.isEmpty()) conditions.add(cb.equal(cb.lower(cb.trim(root.get("roleCategory"))), category));
            if (!city.isEmpty()) conditions.add(cb.equal(cb.lower(cb.trim(root.get("location"))), city));
            return cb.and(conditions.toArray(Predicate[]::new));
        }, Sort.by(Sort.Direction.ASC, "id"));
    }

    public record FilterOptions(List<String> workModes, List<String> roleCategories, List<String> locations) {}

    public FilterOptions filterOptions() {
        return new FilterOptions(uniqueOptions(repository.findWorkModes(), true),
            uniqueOptions(repository.findRoleCategories(), true), uniqueOptions(repository.findLocations(), false));
    }

    private static List<String> uniqueOptions(List<String> values, boolean uppercase) {
        TreeSet<String> options = new TreeSet<>(String.CASE_INSENSITIVE_ORDER);
        for (String value : values) {
            if (value == null || value.isBlank()) continue;
            options.add(uppercase ? value.strip().toUpperCase(Locale.ROOT) : value.strip());
        }
        return List.copyOf(options);
    }

    private static String normalize(String value) {
        return value == null ? "" : value.strip().toLowerCase(Locale.ROOT);
    }

    public Internship findById(Long id) {
        return repository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Internship not found"));
    }
}
