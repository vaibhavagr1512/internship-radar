CREATE TABLE internships (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    company VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    work_mode VARCHAR(255) NOT NULL,
    role_category VARCHAR(255) NOT NULL,
    eligibility_text VARCHAR(4000) NOT NULL,
    application_url VARCHAR(2048) NOT NULL,
    normalized_application_url VARCHAR(2048) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    deadline DATE NULL,
    last_verified_date DATE NOT NULL,
    CONSTRAINT uk_internships_normalized_url UNIQUE (normalized_application_url)
);
