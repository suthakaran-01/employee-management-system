const API_BASE = '/api';
let currentAuth = null;
let currentUser = null;
let employeesList = [];
let departmentsList = [];

function showMessage(text, isError = false) {
    const msgBox = document.getElementById('statusMessage');
    msgBox.innerText = text;
    msgBox.style.color = isError ? 'red' : 'green';
}

// ===================== PAGE SWITCHING =====================

function showPage(role) {
    document.getElementById('loginPage').classList.add('hidden');
    document.getElementById('topBar').classList.remove('hidden');
    document.getElementById('employeePage').classList.add('hidden');
    document.getElementById('managerPage').classList.add('hidden');
    document.getElementById('adminPage').classList.add('hidden');

    if (role === 'EMPLOYEE') {
        document.getElementById('employeePage').classList.remove('hidden');
    } else if (role === 'MANAGER') {
        document.getElementById('managerPage').classList.remove('hidden');
    } else if (role === 'ADMIN') {
        document.getElementById('adminPage').classList.remove('hidden');
        loadEmployees();
        loadDepartments();
    }
}

function logout() {
    currentAuth = null;
    currentUser = null;
    document.getElementById('loginPage').classList.remove('hidden');
    document.getElementById('topBar').classList.add('hidden');
    document.getElementById('employeePage').classList.add('hidden');
    document.getElementById('managerPage').classList.add('hidden');
    document.getElementById('adminPage').classList.add('hidden');
    document.getElementById('loginForm').reset();
    showMessage('Logged out.');
}

document.getElementById('logoutBtn').addEventListener('click', logout);

// ===================== LOGIN (with real credential verification) =====================

document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const authHeader = 'Basic ' + btoa(email + ':' + password);

    // Step 1: load the employee list to find who this email belongs to
    fetch(`${API_BASE}/employees`)
        .then(response => response.json())
        .then(employees => {
            employeesList = employees;
            const matchedEmployee = employees.find(emp => emp.email === email);

            if (!matchedEmployee) {
                showMessage('No account found with that email.', true);
                return;
            }

            // Step 2: verify the password is actually correct by calling a protected endpoint
            return fetch(`${API_BASE}/leaves/employee/${matchedEmployee.id}`, {
                headers: { 'Authorization': authHeader }
            }).then(response => {
                if (!response.ok) {
                    throw new Error('Incorrect password.');
                }
                // Credentials are valid — log in for real
                currentAuth = authHeader;
                currentUser = matchedEmployee;
                document.getElementById('welcomeText').innerText =
                    `Welcome, ${matchedEmployee.name} (${matchedEmployee.role})`;
                showMessage('Login successful.');
                showPage(matchedEmployee.role);

                if (matchedEmployee.role === 'EMPLOYEE') {
                    document.getElementById('myProfileInfo').innerText =
                        `Name: ${matchedEmployee.name} | Email: ${matchedEmployee.email} | Department: ${matchedEmployee.department ? matchedEmployee.department.name : 'Not assigned'}`;
                }
            });
        })
        .catch(error => showMessage('Login failed: ' + error.message, true));
});

// ===================== EMPLOYEE DASHBOARD =====================

document.getElementById('applyLeaveForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const leaveRequest = {
        employee: { id: currentUser.id },
        fromDate: document.getElementById('fromDate').value,
        toDate: document.getElementById('toDate').value
    };

    fetch(`${API_BASE}/leaves`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': currentAuth
        },
        body: JSON.stringify(leaveRequest)
    })
    .then(response => {
        if (!response.ok) throw new Error('Status ' + response.status);
        return response.json();
    })
    .then(data => {
        showMessage('Leave applied, status: ' + data.status);
        event.target.reset();
    })
    .catch(error => showMessage('Failed to apply for leave: ' + error.message, true));
});

document.getElementById('loadMyLeavesBtn').addEventListener('click', function() {
    fetch(`${API_BASE}/leaves/employee/${currentUser.id}`, {
        headers: { 'Authorization': currentAuth }
    })
    .then(response => {
        if (!response.ok) throw new Error('Status ' + response.status);
        return response.json();
    })
    .then(leaves => {
        const tableBody = document.getElementById('myLeavesTableBody');
        tableBody.innerHTML = '';

        if (leaves.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="4">No leave requests found.</td></tr>';
            return;
        }

        leaves.forEach(leave => {
            const row = document.createElement('tr');
            const statusColor = leave.status === 'APPROVED' ? 'green'
                               : leave.status === 'REJECTED' ? 'red' : 'orange';
            row.innerHTML = `
                <td>${leave.id}</td>
                <td>${leave.fromDate}</td>
                <td>${leave.toDate}</td>
                <td style="color:${statusColor}; font-weight:bold;">${leave.status}</td>
            `;
            tableBody.appendChild(row);
        });
        showMessage(`Loaded ${leaves.length} leave request(s).`);
    })
    .catch(error => showMessage('Failed to load your leaves: ' + error.message, true));
});

// ===================== MANAGER DASHBOARD =====================

document.getElementById('loadPendingBtn').addEventListener('click', function() {
    fetch(`${API_BASE}/leaves/pending`, {
        headers: { 'Authorization': currentAuth }
    })
    .then(response => {
        if (!response.ok) throw new Error('Status ' + response.status);
        return response.json();
    })
    .then(leaves => {
        const tableBody = document.getElementById('leaveTableBody');
        tableBody.innerHTML = '';
        leaves.forEach(leave => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${leave.id}</td>
                <td>${leave.employee.id}</td>
                <td>${leave.fromDate}</td>
                <td>${leave.toDate}</td>
                <td>${leave.status}</td>
                <td>
                    <button onclick="updateLeaveStatus(${leave.id}, 'approve')">Approve</button>
                    <button onclick="updateLeaveStatus(${leave.id}, 'reject')">Reject</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
        showMessage(`Loaded ${leaves.length} pending request(s).`);
    })
    .catch(error => showMessage('Failed to load pending leaves: ' + error.message, true));
});

function updateLeaveStatus(leaveId, action) {
    fetch(`${API_BASE}/leaves/${leaveId}/${action}`, {
        method: 'PUT',
        headers: { 'Authorization': currentAuth }
    })
    .then(response => {
        if (!response.ok) throw new Error('Status ' + response.status + ' — check your role/permissions.');
        return response.json();
    })
    .then(data => {
        showMessage(`Leave ${action}d successfully — new status: ${data.status}`);
        document.getElementById('loadPendingBtn').click();
    })
    .catch(error => showMessage('Failed: ' + error.message, true));
}

// ===================== ADMIN DASHBOARD =====================

function renderEmployeeTable(employees) {
    const tableBody = document.getElementById('employeeTableBody');
    tableBody.innerHTML = '';
    employees.forEach(emp => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${emp.id}</td>
            <td>${emp.name}</td>
            <td>${emp.email}</td>
            <td>${emp.role}</td>
            <td>${emp.department ? emp.department.name : '—'}</td>
        `;
        tableBody.appendChild(row);
    });
}

function populateEmployeeDropdown() {
    const empSelect = document.getElementById('assignEmpSelect');
    empSelect.innerHTML = '';
    employeesList.forEach(emp => {
        const option = document.createElement('option');
        option.value = emp.id;
        option.innerText = `${emp.name} (${emp.email})`;
        empSelect.appendChild(option);
    });
}

function loadEmployees() {
    fetch(`${API_BASE}/employees`)
        .then(response => response.json())
        .then(employees => {
            employeesList = employees;
            renderEmployeeTable(employees);
            populateEmployeeDropdown();
        })
        .catch(error => showMessage('Error loading employees: ' + error.message, true));
}

function loadDepartments() {
    fetch(`${API_BASE}/departments`, {
        headers: { 'Authorization': currentAuth }
    })
        .then(response => {
            if (!response.ok) throw new Error('Status ' + response.status);
            return response.json();
        })
        .then(departments => {
            departmentsList = departments;

            const listEl = document.getElementById('departmentList');
            listEl.innerHTML = '';
            departments.forEach(dept => {
                const li = document.createElement('li');
                li.innerText = `${dept.id} — ${dept.name}`;
                listEl.appendChild(li);
            });

            const deptSelect = document.getElementById('assignDeptSelect');
            deptSelect.innerHTML = '';
            departments.forEach(dept => {
                const option = document.createElement('option');
                option.value = dept.id;
                option.innerText = dept.name;
                deptSelect.appendChild(option);
            });
        })
        .catch(error => showMessage('Error loading departments: ' + error.message, true));
}

document.getElementById('searchBtn').addEventListener('click', function() {
    const query = document.getElementById('searchInput').value.trim();
    if (!query) {
        showMessage('Type a name to search.', true);
        return;
    }
    fetch(`${API_BASE}/employees/search?name=${encodeURIComponent(query)}`)
        .then(response => {
            if (!response.ok) throw new Error('Status ' + response.status);
            return response.json();
        })
        .then(employees => renderEmployeeTable(employees))
        .catch(error => showMessage('Search failed: ' + error.message, true));
});

document.getElementById('clearSearchBtn').addEventListener('click', function() {
    document.getElementById('searchInput').value = '';
    loadEmployees();
});

document.getElementById('addEmployeeForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const newEmployee = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        password: document.getElementById('password').value,
        role: document.getElementById('role').value
    };

    fetch(`${API_BASE}/employees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEmployee)
    })
    .then(response => {
        if (!response.ok) throw new Error('Status ' + response.status);
        return response.json();
    })
    .then(data => {
        showMessage('Employee added: ' + data.name);
        loadEmployees();
        event.target.reset();
    })
    .catch(error => showMessage('Failed to add employee: ' + error.message, true));
});

document.getElementById('addDepartmentForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const newDept = { name: document.getElementById('deptName').value };

    fetch(`${API_BASE}/departments`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': currentAuth
        },
        body: JSON.stringify(newDept)
    })
    .then(response => {
        if (!response.ok) throw new Error('Status ' + response.status + ' — Admin role required.');
        return response.json();
    })
    .then(data => {
        showMessage('Department added: ' + data.name);
        loadDepartments();
        event.target.reset();
    })
    .catch(error => showMessage('Failed to add department: ' + error.message, true));
});

document.getElementById('assignDeptForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const empId = document.getElementById('assignEmpSelect').value;
    const deptId = document.getElementById('assignDeptSelect').value;
    const employee = employeesList.find(emp => emp.id == empId);

    if (!employee) {
        showMessage('Employee not found.', true);
        return;
    }

    const updatedEmployee = {
        name: employee.name,
        email: employee.email,
        role: employee.role,
        department: { id: deptId }
    };

    fetch(`${API_BASE}/employees/${empId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': currentAuth
        },
        body: JSON.stringify(updatedEmployee)
    })
    .then(response => {
        if (!response.ok) throw new Error('Status ' + response.status + ' — Admin role required.');
        return response.json();
    })
    .then(data => {
        showMessage(`${data.name} assigned to department successfully.`);
        loadEmployees();
    })
    .catch(error => showMessage('Failed to assign department: ' + error.message, true));
});