package com.internshipradar;

import java.net.URI;
import java.util.Locale;

/** Canonicalizes only safe equivalents; path and query remain case-sensitive. */
public final class ApplicationUrl {
    private ApplicationUrl() {}
    public static String normalize(String input) {
        if (input == null) throw new IllegalArgumentException("Application URL is required");
        URI uri = URI.create(URI.create(input.strip()).toASCIIString()).normalize();
        String scheme = uri.getScheme() == null ? "" : uri.getScheme().toLowerCase(Locale.ROOT);
        if (!(scheme.equals("https") || scheme.equals("http")) || uri.getHost() == null || uri.getUserInfo() != null)
            throw new IllegalArgumentException("Application URL must be an absolute HTTP(S) URL without credentials");
        int port = uri.getPort();
        String authority = uri.getHost().toLowerCase(Locale.ROOT)
            + ((port == -1 || (scheme.equals("https") && port == 443) || (scheme.equals("http") && port == 80)) ? "" : ":" + port);
        String path = uri.getRawPath();
        if (path == null || path.isEmpty()) path = "/";
        String result = scheme + "://" + authority + path + (uri.getRawQuery() == null ? "" : "?" + uri.getRawQuery());
        if (result.length() > 2048) throw new IllegalArgumentException("Application URL exceeds 2048 characters");
        return result;
    }
}
