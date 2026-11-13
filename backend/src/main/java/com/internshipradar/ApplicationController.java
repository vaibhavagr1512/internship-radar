package com.internshipradar;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/applications")
public class ApplicationController {
    private final ApplicationService service;

    public ApplicationController(ApplicationService service) { this.service = service; }

    public record SaveApplicationRequest(Long internshipId) {}
    public record UpdateStatusRequest(ApplicationStatus status) {}

    @GetMapping
    public List<ApplicationResponse> list(@RequestParam(required = false) ApplicationStatus status) {
        return service.list(status);
    }

    @GetMapping("/{id}")
    public ApplicationResponse get(@PathVariable Long id) { return service.find(id); }

    @PostMapping
    public ResponseEntity<ApplicationResponse> save(@RequestBody SaveApplicationRequest request) {
        ApplicationResponse application = service.save(request.internshipId());
        return ResponseEntity.created(URI.create("/api/applications/" + application.id())).body(application);
    }

    @PatchMapping("/{id}")
    public ApplicationResponse update(@PathVariable Long id, @RequestBody UpdateStatusRequest request) {
        return service.updateStatus(id, request.status());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void remove(@PathVariable Long id) { service.remove(id); }
}
