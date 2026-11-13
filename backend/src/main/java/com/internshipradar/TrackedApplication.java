package com.internshipradar;

import jakarta.persistence.*;
import java.time.Instant;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "internship_applications", uniqueConstraints =
    @UniqueConstraint(name = "uk_application_internship", columnNames = "internship_id"))
public class TrackedApplication {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "internship_id", nullable = false)
    private Internship internship;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 32)
    private ApplicationStatus status;

    @Column(nullable = false, updatable = false)
    private Instant savedAt;

    @Column(nullable = false)
    private Instant updatedAt;

    protected TrackedApplication() {}

    public TrackedApplication(Internship internship) {
        this.internship = internship;
        this.status = ApplicationStatus.SAVED;
        this.savedAt = Instant.now();
        this.updatedAt = savedAt;
    }

    public void updateStatus(ApplicationStatus status) {
        this.status = status;
        this.updatedAt = Instant.now();
    }

    public Long getId() { return id; }
    public Internship getInternship() { return internship; }
    public ApplicationStatus getStatus() { return status; }
    public Instant getSavedAt() { return savedAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
