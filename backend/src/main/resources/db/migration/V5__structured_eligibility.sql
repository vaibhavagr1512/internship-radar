ALTER TABLE internships
    ADD COLUMN minimum_cgpa DECIMAL(4,2) NULL,
    ADD COLUMN eligibility_verified BOOLEAN NOT NULL DEFAULT FALSE,
    ADD CONSTRAINT ck_minimum_cgpa CHECK (minimum_cgpa IS NULL OR minimum_cgpa BETWEEN 0 AND 10);
CREATE TABLE internship_eligible_degrees (
    internship_id BIGINT NOT NULL,
    degree VARCHAR(16) NOT NULL,
    PRIMARY KEY (internship_id, degree),
    CONSTRAINT fk_eligible_degree_internship FOREIGN KEY (internship_id) REFERENCES internships(id) ON DELETE CASCADE,
    CONSTRAINT ck_degree CHECK (degree IN ('BTECH','BE','BSC','BCA','MTECH','MCA','MSC','OTHER'))
);
CREATE TABLE internship_eligible_years (
    internship_id BIGINT NOT NULL,
    study_year INT NOT NULL,
    PRIMARY KEY (internship_id, study_year),
    CONSTRAINT fk_eligible_year_internship FOREIGN KEY (internship_id) REFERENCES internships(id) ON DELETE CASCADE,
    CONSTRAINT ck_study_year CHECK (study_year BETWEEN 1 AND 6)
);
