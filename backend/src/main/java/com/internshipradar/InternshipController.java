package com.internshipradar;

import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.math.BigDecimal;

@RestController
@RequestMapping("/api/internships")
public class InternshipController {
    private final InternshipService service;

    public InternshipController(InternshipService service) { this.service = service; }

    @GetMapping
    public Object list(@RequestParam(required = false) String search,
                                @RequestParam(required = false) String workMode,
                                @RequestParam(required = false) String roleCategory,
                                @RequestParam(required = false) String location,
                                @RequestParam(required = false) Integer page,
                                @RequestParam(required = false) Integer size,
                                @RequestParam(required = false) String sort,
                                @RequestParam(required = false) String studentDegree,
                                @RequestParam(required = false) Integer studentYear,
                                @RequestParam(required = false) BigDecimal studentCgpa,
                                @RequestParam(defaultValue = "false") boolean matchesOnly) {
        StudentProfile profile = StudentProfile.parse(studentDegree, studentYear, studentCgpa, matchesOnly);
        if (page != null || size != null || sort != null || profile != null)
            return service.findPage(search, workMode, roleCategory, location, page, size, sort, profile, matchesOnly);
        return service.findAll(search, workMode, roleCategory, location);
    }

    @GetMapping("/filter-options")
    public InternshipService.FilterOptions filterOptions() { return service.filterOptions(); }

    @GetMapping("/{id}")
    public Internship get(@PathVariable Long id) { return service.findById(id); }
}
