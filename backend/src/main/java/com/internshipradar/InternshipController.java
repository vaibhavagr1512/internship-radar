package com.internshipradar;
import org.springframework.web.bind.annotation.*;
import java.util.List;
@RestController
@RequestMapping("/api/internships")
public class InternshipController {
    private final InternshipService service;
    public InternshipController(InternshipService service) { this.service = service; }
    @GetMapping
    public List<Internship> list(@RequestParam(required = false) String search) { return service.findAll(search); }
    @GetMapping("/{id}")
    public Internship get(@PathVariable Long id) { return service.findById(id); }
}
