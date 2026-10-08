package com.employeesystem.employeemanagement.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.employeesystem.employeemanagement.entity.LeaveRequest;
import com.employeesystem.employeemanagement.service.LeaveRequestService;

@RestController
@RequestMapping("/api/leaves")
public class LeaveRequestController {

    @Autowired
    private LeaveRequestService leaveRequestService;

    @PostMapping
    public LeaveRequest applyForLeave(@RequestBody LeaveRequest leaveRequest) {
        return leaveRequestService.applyForLeave(leaveRequest);
    }

    @GetMapping("/pending")
    public List<LeaveRequest> getPendingRequests() {
        return leaveRequestService.getPendingRequests();
    }

    @PutMapping("/{id}/approve")
    public LeaveRequest approve(@PathVariable Long id) {
        return leaveRequestService.approveLeave(id);
    }

    @PutMapping("/{id}/reject")
    public LeaveRequest reject(@PathVariable Long id) {
        return leaveRequestService.rejectLeave(id);
    }

    @GetMapping("/employee/{employeeId}")
    public List<LeaveRequest> getEmployeeLeaves(@PathVariable Long employeeId) {
        return leaveRequestService.getEmployeeLeaves(employeeId);
    }
}