package com.employeesystem.employeemanagement.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.employeesystem.employeemanagement.entity.LeaveRequest;
import com.employeesystem.employeemanagement.entity.LeaveStatus;

public interface LeaveRequestRepository extends JpaRepository<LeaveRequest,Long> {

	List<LeaveRequest> findByEmployeeId(Long employeeId);

	List<LeaveRequest> findByStatus(LeaveStatus status);

}
