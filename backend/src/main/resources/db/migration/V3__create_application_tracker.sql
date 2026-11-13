CREATE TABLE internship_applications (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    internship_id BIGINT NOT NULL,
    status VARCHAR(32) NOT NULL,
    saved_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT uk_application_internship UNIQUE (internship_id),
    CONSTRAINT fk_application_internship FOREIGN KEY (internship_id) REFERENCES internships(id),
    CONSTRAINT ck_application_status CHECK (status IN ('SAVED', 'APPLIED', 'INTERVIEW', 'OFFER', 'REJECTED')),
    INDEX ix_application_status_saved (status, saved_at)
);
