package com.internshipradar;

import javax.sql.DataSource;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.env.Environment;
import static org.assertj.core.api.Assertions.assertThat;

/** Runs only in the dedicated MySQL job, before or after existing migrations. */
@SpringBootTest
@EnabledIfEnvironmentVariable(named = "SPRING_PROFILES_ACTIVE", matches = "ci-mysql")
class MySqlMigrationTest {
    @Autowired DataSource dataSource;
    @Autowired Flyway flyway;
    @Autowired Environment environment;

    @Test void usesMySqlWithSchemaValidationInsteadOfGeneratedTables() throws Exception {
        try (var connection = dataSource.getConnection()) {
            assertThat(connection.getMetaData().getDatabaseProductName()).isEqualTo("MySQL");
            assertThat(connection.getMetaData().getURL()).startsWith("jdbc:mysql:");
        }
        assertThat(environment.getProperty("spring.jpa.hibernate.ddl-auto")).isEqualTo("validate");
    }

    @Test void validatesAllVersionedMigrationsIncludingDemoEligibility() {
        flyway.validate();
        assertThat(flyway.info().pending()).isEmpty();
        assertThat(flyway.info().applied())
            .extracting(migration -> migration.getVersion().getVersion())
            .containsExactly("1", "2", "3", "4", "5", "6");
    }
}
