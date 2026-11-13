package com.internshipradar;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.math.BigDecimal;
import java.util.Set;
import java.util.HashSet;
import com.fasterxml.jackson.annotation.JsonIgnore;
import org.hibernate.annotations.BatchSize;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "internships", uniqueConstraints = @UniqueConstraint(name = "uk_internships_normalized_url", columnNames = "normalizedApplicationUrl"))
public class Internship {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, length = 255)
    private String title;
    @Column(nullable = false, length = 255)
    private String company;
    @Column(nullable = false, length = 255)
    private String location;
    @Column(nullable = false, length = 255)
    private String workMode;
    @Column(nullable = false, length = 255)
    private String roleCategory;
    @Column(nullable = false, length = 4000)
    private String eligibilityText;
    @Column(nullable = false, length = 2048)
    private String applicationUrl;
    @Column(nullable = true)
    private LocalDate deadline;
    @Column(nullable = false)
    private LocalDate lastVerifiedDate;
    @Column(nullable = false, length = 2048)
    private String normalizedApplicationUrl;
    @Column(precision = 4, scale = 2)
    private BigDecimal minimumCgpa;
    @Column(nullable = false)
    private boolean eligibilityVerified;
    @ElementCollection
    @CollectionTable(name = "internship_eligible_degrees", joinColumns = @JoinColumn(name = "internship_id"))
    @Column(name = "degree", length = 16, nullable = false)
    @Enumerated(EnumType.STRING) @JdbcTypeCode(SqlTypes.VARCHAR)
    @BatchSize(size = 50) @OnDelete(action = OnDeleteAction.CASCADE)
    private Set<Degree> eligibleDegrees = new HashSet<>();
    @ElementCollection
    @CollectionTable(name = "internship_eligible_years", joinColumns = @JoinColumn(name = "internship_id"))
    @Column(name = "study_year", nullable = false)
    @BatchSize(size = 50) @OnDelete(action = OnDeleteAction.CASCADE)
    private Set<Integer> eligibleStudyYears = new HashSet<>();

    public void configureEligibility(Set<Degree> degrees, Set<Integer> years, BigDecimal minimum, boolean verified) {
        if (minimum != null && (minimum.signum() < 0 || minimum.compareTo(BigDecimal.TEN) > 0 || minimum.stripTrailingZeros().scale() > 2)) throw new IllegalArgumentException("Invalid minimum CGPA");
        if (years.stream().anyMatch(year -> year < 1 || year > 6)) throw new IllegalArgumentException("Invalid study year");
        eligibleDegrees.clear(); eligibleDegrees.addAll(degrees);
        eligibleStudyYears.clear(); eligibleStudyYears.addAll(years);
        minimumCgpa = minimum; eligibilityVerified = verified;
    }
    @JsonIgnore public Set<Degree> getEligibleDegrees() { return eligibleDegrees; }
    @JsonIgnore public Set<Integer> getEligibleStudyYears() { return eligibleStudyYears; }
    @JsonIgnore public BigDecimal getMinimumCgpa() { return minimumCgpa; }
    @JsonIgnore public boolean isEligibilityVerified() { return eligibilityVerified; }
    protected Internship() {}
    public Internship(String title, String company, String location, String workMode, String roleCategory, String eligibilityText, String applicationUrl, LocalDate deadline, LocalDate lastVerifiedDate) {
        this.title = title;
        this.company = company;
        this.location = location;
        this.workMode = workMode;
        this.roleCategory = roleCategory;
        this.eligibilityText = eligibilityText;
        this.applicationUrl = applicationUrl;
        this.deadline = deadline;
        this.lastVerifiedDate = lastVerifiedDate;
        normalizeUrl();
    }
    @PrePersist @PreUpdate
    void normalizeUrl() { normalizedApplicationUrl = ApplicationUrl.normalize(applicationUrl); }
    public Long getId() { return id; }
    public String getTitle() { return title; }
    public String getCompany() { return company; }
    public String getLocation() { return location; }
    public String getWorkMode() { return workMode; }
    public String getRoleCategory() { return roleCategory; }
    public String getEligibilityText() { return eligibilityText; }
    public String getApplicationUrl() { return applicationUrl; }
    public LocalDate getDeadline() { return deadline; }
    public LocalDate getLastVerifiedDate() { return lastVerifiedDate; }
}
