package com.internshipradar;

import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Sort;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
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
        return repository.findAll(matching(search, workMode, roleCategory, location), Sort.by(Sort.Direction.ASC, "id"));
    }

    private Specification<Internship> matching(String search, String workMode, String roleCategory, String location) {
        String term = normalize(search);
        String mode = normalize(workMode);
        String category = normalize(roleCategory);
        String city = normalize(location);

        return (root, query, cb) -> {
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
        };
    }

    public record InternshipPage(List<Internship> content, int page, int size, long totalElements,
                                 int totalPages, boolean first, boolean last) {}

    public InternshipPage findPage(String search, String workMode, String roleCategory, String location,
                                  Integer requestedPage, Integer requestedSize, String requestedSort) {
        int page = requestedPage == null ? 0 : requestedPage;
        int size = requestedSize == null ? 6 : requestedSize;
        if (page < 0 || page > 1_000_000 || size < 1 || size > 50)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "page must be 0..1000000 and size must be 1..50");
        String ordering = requestedSort == null ? "lastVerifiedDate,desc" : requestedSort.strip();
        if (!List.of("deadline,asc", "deadline,desc", "lastVerifiedDate,asc", "lastVerifiedDate,desc").contains(ordering))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported sort field or direction");
        String[] parts = ordering.split(",");
        String field = parts[0];
        boolean ascending = parts[1].equals("asc");
        Specification<Internship> specification = (root, query, cb) -> {
            Predicate predicate = matching(search, workMode, roleCategory, location).toPredicate(root, query, cb);
            // Count queries must not contain ordering; dates without a deadline always sort last.
            if (query.getResultType() != Long.class && query.getResultType() != long.class) {
                List<jakarta.persistence.criteria.Order> orders = new ArrayList<>();
                if (field.equals("deadline")) orders.add(cb.asc(cb.<Integer>selectCase().when(cb.isNull(root.get(field)), 1).otherwise(0)));
                orders.add(ascending ? cb.asc(root.get(field)) : cb.desc(root.get(field)));
                orders.add(cb.asc(root.get("id"))); // Stable tie-breaker across pages.
                query.orderBy(orders);
            }
            return predicate;
        };
        var result = repository.findAll(specification, PageRequest.of(page, size));
        return new InternshipPage(result.getContent(), page, size, result.getTotalElements(), result.getTotalPages(),
            result.isFirst(), result.isLast());
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
