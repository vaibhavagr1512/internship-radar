package com.internshipradar;
import jakarta.persistence.*;
import java.time.LocalDate;

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
