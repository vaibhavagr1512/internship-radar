package com.internshipradar;
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.*;
class ApplicationUrlTest {
    @Test void normalizesSafeEquivalents() {
        assertThat(ApplicationUrl.normalize(" HTTPS://Example.com:443/a/../apply#section "))
            .isEqualTo("https://example.com/apply");
        assertThat(ApplicationUrl.normalize("http://EXAMPLE.COM:80")).isEqualTo("http://example.com/");
    }
    @Test void preservesMeaningfulDifferences() {
        assertThat(ApplicationUrl.normalize("https://example.com/Apply?Ref=ABC"))
            .isEqualTo("https://example.com/Apply?Ref=ABC");
        assertThat(ApplicationUrl.normalize("https://example.com:8443/apply/"))
            .isEqualTo("https://example.com:8443/apply/");
    }
    @Test void encodesUnicodePath() {
        assertThat(ApplicationUrl.normalize("https://example.com/café"))
            .isEqualTo("https://example.com/caf%C3%A9");
    }
    @Test void rejectsInvalidUrls() {
        for (String value : new String[]{"/relative", "javascript:alert(1)", "https://user:pass@example.com", "garbage"})
            assertThatThrownBy(() -> ApplicationUrl.normalize(value)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> ApplicationUrl.normalize(null)).isInstanceOf(IllegalArgumentException.class);
    }
}
