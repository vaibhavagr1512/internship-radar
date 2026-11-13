FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN addgroup -S radar && adduser -S radar -G radar
# The release ZIP includes this jar. Source checkouts: node scripts/build-release.mjs
COPY --chown=radar:radar dist/internship-radar.jar /app/app.jar
USER radar
EXPOSE 8080
HEALTHCHECK --interval=10s --timeout=5s --start-period=60s --retries=12 \
  CMD wget -Y off -q -O /dev/null http://127.0.0.1:8080/api/internships || exit 1
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
