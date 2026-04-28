package com.example.fabritrack.repository;

import com.example.fabritrack.entity.Department;
import com.example.fabritrack.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface EmployeeRepository extends JpaRepository<Employee, Long> {

    boolean existsByEmployeeNumber(String employeeNumber);

    boolean existsByEmployeeNumberAndIdNot(String employeeNumber, Long id);

    List<Employee> findByStatus(Employee.EmployeeStatus status);

    List<Employee> findByDepartment(Department department);

    /** Find personnel record linked to a system user (for assignment compatibility). */
    Optional<Employee> findByUser_Id(UUID userId);

    /** Next sequence number for auto-generated employee numbers (EMP00001, EMP00002, ...). */
    @Query(value = "SELECT COALESCE(MAX(CAST(SUBSTRING(employee_number FROM 4) AS INTEGER)), 0) + 1 FROM employees WHERE employee_number ~ '^EMP[0-9]{5}$'", nativeQuery = true)
    Long getNextEmployeeSequence();
}
