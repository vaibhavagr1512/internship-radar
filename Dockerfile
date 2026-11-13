FROM eclipse-temurin:21-jre-alpine
# A numeric non-root user avoids extra filesystem layers and needs no system account.
COPY --chown=10001:10001 --chmod=0444 dist/internship-radar.jar /app.jar
USER 10001:10001
EXPOSE 8080
HEALTHCHECK --interval=10s --timeout=5s --start-period=60s --retries=12 \
  CMD wget -Y off -q -O /dev/null http://127.0.0.1:8080/api/internships || exit 1
ENTRYPOINT ["java", "-jar", "/app.jar"]
