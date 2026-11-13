package com.internshipradar;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ApplicationRepository extends JpaRepository<TrackedApplication, Long> {
    boolean existsByInternshipId(Long internshipId);

    @EntityGraph(attributePaths = "internship")
    List<TrackedApplication> findAllByOrderBySavedAtDescIdDesc();

    @EntityGraph(attributePaths = "internship")
    List<TrackedApplication> findByStatusOrderBySavedAtDescIdDesc(ApplicationStatus status);
}
