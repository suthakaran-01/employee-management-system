# Employee Management System with Leave Management

A role-based internal tool for managing employees and their leave requests — built as a scaled-down version of the kind of HR system companies like Zoho People, Keka, or Darwinbox sell commercially.

Built by [Suthakaran S](https://www.linkedin.com/in/suthakaran-s) while training as a Java Full Stack Developer at Q Spiders, Chennai.

## What it does

The system supports three roles, each with different permissions:

| Role | Can do |
|---|---|
| **Admin** | Add/edit/delete employees, manage departments, assign employees to departments |
| **Manager** | View and approve/reject pending leave requests from employees |
| **Employee** | View own profile, apply for leave, check leave request status |

Leave requests follow a real business workflow — apply, pending, approved or rejected — modeled as an explicit state machine rather than a simple flag.

## Tech stack

- **Backend:** Java, Spring Boot, Spring Security, Spring Data JPA (Hibernate)
- **Database:** MySQL
- **Frontend:** HTML, CSS, JavaScript (vanilla, no framework)
- **Auth:** BCrypt password hashing, HTTP Basic Auth, role-based authorization
- **Build tool:** Maven

## Architecture

The application follows a standard layered (N-tier) architecture:

Client (Browser)
&nbsp;&nbsp;&nbsp;&nbsp;↓
Spring Security — authentication and role-based access control
&nbsp;&nbsp;&nbsp;&nbsp;↓
Controller — REST API endpoints
&nbsp;&nbsp;&nbsp;&nbsp;↓
Service — business logic, including the leave approval workflow
&nbsp;&nbsp;&nbsp;&nbsp;↓
Repository — Spring Data JPA, database access
&nbsp;&nbsp;&nbsp;&nbsp;↓
MySQL Database

Each layer has exactly one responsibility. Controllers handle HTTP only; business rules live in the service layer; the repository layer never contains logic beyond data access. This separation keeps the codebase maintainable as it grows.

## Database design

Three related tables:

- **Department** — id, name
- **Employee** — id, name, email, password, role, department_id (foreign key)
- **LeaveRequest** — id, employee_id (foreign key), from_date, to_date, status

One Department has many Employees. One Employee has many LeaveRequests.

## Security

- Passwords are hashed with BCrypt before storage — never stored in plain text
- Role-based endpoint protection via Spring Security — for example, only a Manager can approve or reject leave, and only an Admin can manage departments or edit employees
- Verified end-to-end: unauthenticated requests are rejected with 401, authenticated requests with the wrong role are rejected with 403, and correctly authorized requests succeed with 200

## Running it locally

**Prerequisites:** JDK 17+, MySQL 8.0, Maven

1. Clone the repository
2. Create a MySQL database named `employee_management_db`
3. Set these environment variables (or edit `application.properties` directly for local testing): `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`
4. Run the backend with `mvnw spring-boot:run`
5. Open `frontend/index.html` using a local server such as VS Code's Live Server extension

## What I'd improve next

- Move from HTTP Basic Auth to JWT tokens for a stateless, more production-realistic auth flow
- Add pagination to the employee list for larger datasets
- Add automated tests for the service layer
- Move from automatic schema updates to a proper migration tool such as Flyway for production use

## Author

**Suthakaran S**
Java Full Stack Developer (in training) — Q Spiders, Chennai
[LinkedIn](https://www.linkedin.com/in/suthakaran-s) · suthakarans021@gmail.com