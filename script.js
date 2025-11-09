// Application State
let currentUser = null;
let users = JSON.parse(localStorage.getItem('teamflow_users') || '[]');
let tasks = JSON.parse(localStorage.getItem('teamflow_tasks') || '[]');

// DOM Elements
const authSection = document.getElementById('authSection');
const mainApp = document.getElementById('mainApp');
const signupForm = document.getElementById('signupForm');
const loginForm = document.getElementById('loginForm');
const taskForm = document.getElementById('taskForm');
const logoutBtn = document.getElementById('logoutBtn');
const searchInput = document.getElementById('searchInput');
const sortTasks = document.getElementById('sortTasks');

// Initialize Application
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    loadSampleData();
    checkDeadlines();
    setInterval(checkDeadlines, 60000); // Check every minute
    
    // Set minimum date to today for task deadline
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('taskDeadline').setAttribute('min', today);
});

// Event Listeners
function setupEventListeners() {
    signupForm.addEventListener('submit', handleSignup);
    loginForm.addEventListener('submit', handleLogin);
    taskForm.addEventListener('submit', handleTaskCreate);
    logoutBtn.addEventListener('click', handleLogout);

    // New features
    searchInput.addEventListener('input', displayTasks);
    sortTasks.addEventListener('change', displayTasks);
}

// Authentication Functions
function handleSignup(e) {
    e.preventDefault();
    
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const role = document.getElementById('signupRole').value;

    if (users.find(user => user.email === email)) {
        showNotification('User already exists with this email!', 'error');
        return;
    }

    const newUser = {
        id: Date.now(),
        name,
        email,
        password,
        role,
        joinedDate: new Date().toISOString()
    };

    users.push(newUser);
    localStorage.setItem('teamflow_users', JSON.stringify(users));
    
    showNotification('Account created successfully! Please login.', 'success');
    signupForm.reset();
}

function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
        currentUser = user;
        showMainApp();
        showNotification(`Welcome back, ${user.name}!`, 'success');
    } else {
        showNotification('Invalid email or password!', 'error');
    }
}

function handleLogout() {
    currentUser = null;
    authSection.style.display = 'block';
    mainApp.style.display = 'none';
    showNotification('Logged out successfully!', 'success');
}

// Main App Functions
function showMainApp() {
    authSection.style.display = 'none';
    mainApp.style.display = 'block';
    
    updateUserInfo();
    updateTeamList();
    updateTaskAssigneeOptions();
    displayTasks();
    updateStatistics();
}

function updateUserInfo() {
    document.getElementById('userName').textContent = currentUser.name;
    document.getElementById('userRole').textContent = currentUser.role;
    document.getElementById('userAvatar').textContent = currentUser.name.charAt(0).toUpperCase();
}

function updateTeamList() {
    const teamList = document.getElementById('teamList');
    teamList.innerHTML = '';
    
    users.forEach(user => {
        const memberDiv = document.createElement('div');
        memberDiv.className = 'team-member';
        memberDiv.innerHTML = `
            <div class="avatar">${user.name.charAt(0).toUpperCase()}</div>
            <div>
                <div style="font-weight: 600;">${user.name}</div>
                <div style="font-size: 0.85rem; color: #666;">${user.role}</div>
            </div>
        `;
        teamList.appendChild(memberDiv);
    });
}

function updateTaskAssigneeOptions() {
    const select = document.getElementById('taskAssignee');
    select.innerHTML = '<option value="">Select Team Member</option>';
    
    users.forEach(user => {
        const option = document.createElement('option');
        option.value = user.id;
        option.textContent = `${user.name} (${user.role})`;
        select.appendChild(option);
    });
}

// Task Management Functions
function handleTaskCreate(e) {
    e.preventDefault();
    
    const title = document.getElementById('taskTitle').value;
    const assigneeId = parseInt(document.getElementById('taskAssignee').value);
    const deadline = document.getElementById('taskDeadline').value;
    const priority = document.getElementById('taskPriority').value;
    const description = document.getElementById('taskDescription').value;

    const assignee = users.find(u => u.id === assigneeId);
    
    const newTask = {
        id: Date.now(),
        title,
        description,
        assigneeId,
        assigneeName: assignee.name,
        createdBy: currentUser.name,
        createdById: currentUser.id,
        deadline,
        priority,
        status: 'pending',
        createdDate: new Date().toISOString()
    };

    tasks.push(newTask);
    localStorage.setItem('teamflow_tasks', JSON.stringify(tasks));
    
    displayTasks();
    updateStatistics();
    showNotification(`Task assigned to ${assignee.name}!`, 'success');
    taskForm.reset();
}

function updateTaskStatus(taskId, newStatus) {
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex !== -1) {
        tasks[taskIndex].status = newStatus;
        localStorage.setItem('teamflow_tasks', JSON.stringify(tasks));
        displayTasks();
        updateStatistics();
        showNotification('Task status updated!', 'success');
    }
}

function deleteTask(taskId) {
    if (confirm('Are you sure you want to delete this task?')) {
        tasks = tasks.filter(t => t.id !== taskId);
        localStorage.setItem('teamflow_tasks', JSON.stringify(tasks));
        displayTasks();
        updateStatistics();
        showNotification('Task deleted!', 'success');
    }
}

// 🔍 Search + Sort + Render
function displayTasks() {
    const searchValue = searchInput.value.toLowerCase();
    const sortValue = sortTasks.value;

    let filteredTasks = tasks.filter(task => 
        task.title.toLowerCase().includes(searchValue) ||
        (task.description && task.description.toLowerCase().includes(searchValue))
    );

    if (sortValue === 'deadline') {
        filteredTasks.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
    } else if (sortValue === 'priority') {
        const order = { High: 1, Medium: 2, Low: 3 };
        filteredTasks.sort((a, b) => order[a.priority] - order[b.priority]);
    }

    renderTasks(filteredTasks);
}

function renderTasks(taskList) {
    const pendingList = document.getElementById('pendingTasksList');
    const progressList = document.getElementById('progressTasksList');
    const completedList = document.getElementById('completedTasksList');
    
    pendingList.innerHTML = '';
    progressList.innerHTML = '';
    completedList.innerHTML = '';

    taskList.forEach(task => {
        const taskCard = createTaskCard(task);
        if (task.status === 'pending') pendingList.appendChild(taskCard);
        if (task.status === 'progress') progressList.appendChild(taskCard);
        if (task.status === 'completed') completedList.appendChild(taskCard);
    });
}

function createTaskCard(task) {
    const card = document.createElement('div');
    card.className = 'task-card';
    
    const deadline = new Date(task.deadline);
    const today = new Date();
    const daysUntilDeadline = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
    
    let deadlineClass = '';
    let deadlineText = deadline.toLocaleDateString();
    
    if (daysUntilDeadline < 0) {
        deadlineClass = 'overdue';
        deadlineText = `Overdue (${deadlineText})`;
        card.classList.add('overdue');
    } else if (daysUntilDeadline <= 2) {
        deadlineClass = 'due-soon';
        deadlineText = `Due ${daysUntilDeadline === 0 ? 'Today' : 'in ' + daysUntilDeadline + ' day(s)'}`;
    }

    card.innerHTML = `
        <div class="task-title">${task.title}</div>
        <div class="task-description">${task.description || 'No description provided'}</div>
        <div class="task-meta">
            <span class="task-assignee">👤 ${task.assigneeName}</span>
            <span class="task-deadline ${deadlineClass}">📅 ${deadlineText}</span>
        </div>
        <div class="task-meta">
            <span style="font-size: 0.85rem; color: #666;">Priority: ${task.priority}</span>
            <span style="font-size: 0.85rem; color: #666;">By: ${task.createdBy}</span>
        </div>
        <div class="task-actions">
            ${task.status === 'pending' ? `<button class="btn btn-small" onclick="updateTaskStatus(${task.id}, 'progress')">Start</button>` : ''}
            ${task.status === 'progress' ? `<button class="btn btn-small" onclick="updateTaskStatus(${task.id}, 'completed')">Complete</button>` : ''}
            ${task.status === 'completed' ? `<button class="btn btn-small" onclick="updateTaskStatus(${task.id}, 'progress')">Reopen</button>` : ''}
            <button class="btn btn-small btn-secondary" onclick="deleteTask(${task.id})">Delete</button>
        </div>
    `;
    
    return card;
}

function updateStatistics() {
    const total = tasks.length;
    const pending = tasks.filter(t => t.status === 'pending').length;
    const progress = tasks.filter(t => t.status === 'progress').length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    
    document.getElementById('totalTasks').textContent = total;
    document.getElementById('pendingTasks').textContent = pending;
    document.getElementById('inProgressTasks').textContent = progress;
    document.getElementById('completedTasks').textContent = completed;
}

// Deadline Management
function checkDeadlines() {
    if (!currentUser) return;
    
    const today = new Date();
    const upcomingTasks = tasks.filter(task => {
        if (task.status === 'completed') return false;
        const deadline = new Date(task.deadline);
        const daysUntilDeadline = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
        return daysUntilDeadline <= 1 && daysUntilDeadline >= 0;
    });

    upcomingTasks.forEach(task => {
        const deadline = new Date(task.deadline);
        const daysUntilDeadline = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
        if (daysUntilDeadline === 0) {
            showNotification(`⚠️ Task "${task.title}" is due today!`, 'warning');
        } else if (daysUntilDeadline === 1) {
            showNotification(`📅 Task "${task.title}" is due tomorrow!`, 'warning');
        }
    });
}

// Utility Functions
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    const container = document.getElementById('notifications');
    container.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

// Sample Data
function loadSampleData() {
    if (users.length === 0) {
        const sampleUsers = [
            { id: 1, name: 'Alex Johnson', email: 'alex@demo.com', password: 'demo123', role: 'Manager', joinedDate: new Date().toISOString() },
            { id: 2, name: 'Sarah Wilson', email: 'sarah@demo.com', password: 'demo123', role: 'Developer', joinedDate: new Date().toISOString() },
            { id: 3, name: 'Mike Chen', email: 'mike@demo.com', password: 'demo123', role: 'Designer', joinedDate: new Date().toISOString() },
            { id: 4, name: 'Emma Davis', email: 'emma@demo.com', password: 'demo123', role: 'QA', joinedDate: new Date().toISOString() }
        ];
        
        users = sampleUsers;
        localStorage.setItem('teamflow_users', JSON.stringify(users));
    }
}
  