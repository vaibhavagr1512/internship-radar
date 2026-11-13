-- Illustrative DEMO criteria only. This is not verification of a real opening.
UPDATE internships SET minimum_cgpa = 7.00, eligibility_verified = TRUE, eligibility_text = 'DEMO ONLY: B.Tech students in year 3; minimum CGPA 7.00/10. Java and SQL basics are useful.'
WHERE normalized_application_url = 'https://example.com/internships/java' AND title LIKE '[DEMO]%';
UPDATE internships SET minimum_cgpa = NULL, eligibility_verified = TRUE, eligibility_text = 'DEMO ONLY: B.Tech or B.E. students in years 2-4; no minimum CGPA required in this fictional example. React basics are useful.'
WHERE normalized_application_url = 'https://example.com/internships/react' AND title LIKE '[DEMO]%';
INSERT INTO internship_eligible_degrees (internship_id, degree)
SELECT id, 'BTECH' FROM internships WHERE normalized_application_url IN ('https://example.com/internships/java','https://example.com/internships/react') AND title LIKE '[DEMO]%';
INSERT INTO internship_eligible_degrees (internship_id, degree)
SELECT id, 'BE' FROM internships WHERE normalized_application_url = 'https://example.com/internships/react' AND title LIKE '[DEMO]%';
INSERT INTO internship_eligible_years (internship_id, study_year)
SELECT id, 3 FROM internships WHERE normalized_application_url IN ('https://example.com/internships/java','https://example.com/internships/react') AND title LIKE '[DEMO]%';
INSERT INTO internship_eligible_years (internship_id, study_year)
SELECT id, 2 FROM internships WHERE normalized_application_url = 'https://example.com/internships/react' AND title LIKE '[DEMO]%';
INSERT INTO internship_eligible_years (internship_id, study_year)
SELECT id, 4 FROM internships WHERE normalized_application_url = 'https://example.com/internships/react' AND title LIKE '[DEMO]%';
-- The Software demo intentionally remains unverified: CHECK_OFFICIAL, never assumed eligible.
