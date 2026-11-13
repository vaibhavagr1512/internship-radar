package com.internshipradar;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface InternshipRepository extends JpaRepository<Internship, Long> {
    List<Internship> findAllByOrderByIdAsc();
    List<Internship> findByTitleContainingIgnoreCaseOrCompanyContainingIgnoreCaseOrderByIdAsc(String title, String company);
}
