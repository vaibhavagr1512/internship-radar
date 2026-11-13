package com.internshipradar;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface InternshipRepository extends JpaRepository<Internship, Long>, JpaSpecificationExecutor<Internship> {
    @Query("select distinct i.workMode from Internship i where trim(i.workMode) <> '' order by i.workMode")
    List<String> findWorkModes();

    @Query("select distinct i.roleCategory from Internship i where trim(i.roleCategory) <> '' order by i.roleCategory")
    List<String> findRoleCategories();

    @Query("select distinct i.location from Internship i where trim(i.location) <> '' order by i.location")
    List<String> findLocations();
}
