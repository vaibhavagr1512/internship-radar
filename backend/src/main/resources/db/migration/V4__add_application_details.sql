ALTER TABLE internship_applications
    ADD COLUMN notes VARCHAR(2000) NOT NULL DEFAULT '',
    ADD COLUMN applied_date DATE NULL;
