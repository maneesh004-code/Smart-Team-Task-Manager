// Mock Database (in-memory storage)
let users = [
  { _id: '1', name: 'John Doe', email: 'john@example.com', password: 'password123', role: 'Manager' },
  { _id: '2', name: 'Jane Smith', email: 'jane@example.com', password: 'password123', role: 'Developer' }
];

let tasks = [];
let taskIdCounter = 1;
let userIdCounter = 3;

// Application State
let currentUser = null;
let token = null;

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  const taskDeadlineInput = document.getElementById('taskDeadline');
  if (taskDeadlineInput) {
    const today = new Date().toISOString().split('T')[0];
    taskDeadlineInput.setAttribute('min', today);
  }

  // Check if user is already logged in
  const savedUser = JSON.parse(sessionStorage.getItem('currentUser') || 'null');
  if (savedUser) {
    currentUser = savedUser;
    token = 'mock-token';
    showMainApp();
  }
});

// =====================
// PAGE NAVIGATION
// =====================
function showPage(pageName) {
  const pages = document.querySelectorAll('.page');
  pages.forEach(page => page.classList.add('hidden'));
  
  const mainApp = document.getElementById('mainApp');
  mainApp.classList.add('hidden');
  
  const navbar = document.querySelector('.navbar');
  const footer = document.querySelector('.footer');
  
  if (pageName === 'app') {
    mainApp.classList.remove('hidden');
    navbar.classList.add('hidden');
    footer.classList.add('hidden');
  } else {
    document.getElementById(pageName + 'Page').classList.remove('hidden');
    navbar.classList.remove('hidden');
    footer.classList.remove('hidden');
  }
  
  const navMenu = document.getElementById('navMenu');
  navMenu.classList.remove('active');
}

function toggleMenu() {
  const navMenu = document.getElementById('navMenu');
  navMenu.classList.toggle('active');
}

// =====================
// CONTACT FORM
// =====================
function handleContact(e) {
  e.preventDefault();
  showNotification("Thank you for contacting us! We'll get back to you soon.", "success");
  document.getElementById('contactForm').reset();
}

// =====================
// AUTHENTICATION
// =====================
function handleSignup(e) {
  e.preventDefault();

  const name = document.getElementById('signupName').value;
  const email = document.getElementById('signupEmail').value;
  const password = document.getElementById('signupPassword').value;
  const role = document.getElementById('signupRole').value;

  // Check if email already exists
  if (users.find(u => u.email === email)) {
    showNotification("Email already registered!", "error");
    return;
  }

  // Create new user
  const newUser = {
    _id: String(userIdCounter++),
    name,
    email,
    password,
    role
  };

  users.push(newUser);
  
  showNotification("Account created successfully! Please login.", "success");
  document.getElementById('signupForm').reset();
  showPage('login');
}

function handleLogin(e) {
  e.preventDefault();

  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;

  // Find user
  const user = users.find(u => u.email === email && u.password === password);

  if (!user) {
    showNotification("Invalid email or password!", "error");
    return;
  }

  token = 'mock-token-' + user._id;
  currentUser = user;
  sessionStorage.setItem('currentUser', JSON.stringify(user));
  
  showMainApp();
  showNotification(`Welcome back, ${user.name}!`, "success");
}

function handleLogout() {
  token = null;
  currentUser = null;
  sessionStorage.removeItem('currentUser');
  
  showPage('home');
  showNotification("Logged out successfully!", "success");
}

// =====================
// MAIN APP
// =====================
function showMainApp() {
  showPage('app');
  updateUserInfo();
  fetchUsers();
  fetchTasks();
}

function updateUserInfo() {
  document.getElementById("userName").textContent = currentUser.name;
  document.getElementById("userRole").textContent = currentUser.role;
  document.getElementById("userAvatar").textContent = currentUser.name.charAt(0).toUpperCase();
}

// =====================
// USERS
// =====================
function fetchUsers() {
  renderTeamList(users);
  updateTaskAssigneeOptions(users);
}

function renderTeamList(userList) {
  const teamList = document.getElementById("teamList");
  teamList.innerHTML = "";

  userList.forEach((user) => {
    const div = document.createElement("div");
    div.className = "team-member";
    div.innerHTML = `
      <div class="avatar">${user.name.charAt(0).toUpperCase()}</div>
      <div>
        <div style="font-weight:600;">${user.name}</div>
        <div style="font-size:0.85rem;color:#666;">${user.role}</div>
      </div>
    `;
    teamList.appendChild(div);
  });
}

function updateTaskAssigneeOptions(userList) {
  const select = document.getElementById("taskAssignee");
  select.innerHTML = '<option value="">Select Team Member</option>';

  userList.forEach((u) => {
    const opt = document.createElement("option");
    opt.value = u._id;
    opt.textContent = `${u.name} (${u.role})`;
    select.appendChild(opt);
  });
}

// =====================
// TASKS
// =====================
function fetchTasks() {
  renderTasks(tasks);
  updateStatistics(tasks);
}

function handleTaskCreate(e) {
  e.preventDefault();

  const title = document.getElementById("taskTitle").value;
  const assigneeId = document.getElementById("taskAssignee").value;
  const deadline = document.getElementById("taskDeadline").value;
  const priority = document.getElementById("taskPriority").value;
  const description = document.getElementById("taskDescription").value;

  // Find assignee name
  const assignee = users.find(u => u._id === assigneeId);
  if (!assignee) {
    showNotification("Please select a team member!", "error");
    return;
  }

  // Create new task
  const newTask = {
    _id: String(taskIdCounter++),
    title,
    description,
    assigneeId,
    assigneeName: assignee.name,
    deadline,
    priority,
    createdBy: currentUser.name,
    status: 'pending',
    createdAt: new Date()
  };

  tasks.push(newTask);

  showNotification(`Task assigned to ${assignee.name} successfully!`, "success");
  document.getElementById('taskForm').reset();
  fetchTasks();
}

function updateTaskStatus(id, newStatus) {
  const task = tasks.find(t => t._id === id);
  if (task) {
    task.status = newStatus;
    fetchTasks();
    showNotification("Task status updated!", "success");
  }
}

function deleteTask(id) {
  if (!confirm("Are you sure you want to delete this task?")) return;
  
  const index = tasks.findIndex(t => t._id === id);
  if (index > -1) {
    tasks.splice(index, 1);
    showNotification("Task deleted!", "success");
    fetchTasks();
  }
}

// =====================
// DISPLAY HELPERS
// =====================
function renderTasks(taskList) {
  const pending = document.getElementById("pendingTasksList");
  const progress = document.getElementById("progressTasksList");
  const completed = document.getElementById("completedTasksList");

  pending.innerHTML = progress.innerHTML = completed.innerHTML = "";

  if (taskList.length === 0) {
    pending.innerHTML = '<p style="text-align:center;color:#999;padding:20px;">No tasks yet</p>';
    return;
  }

  taskList.forEach((task) => {
    const card = document.createElement("div");
    card.className = "task-card";
    card.innerHTML = `
      <div class="task-title">${task.title}</div>
      <div class="task-description">${task.description || "No description"}</div>
      <div class="task-meta">
        <span>👤 ${task.assigneeName}</span>
        <span>📅 ${new Date(task.deadline).toLocaleDateString()}</span>
      </div>
      <div class="task-meta">
        <span>Priority: ${task.priority}</span>
        <span>By: ${task.createdBy}</span>
      </div>
      <div class="task-actions">
        ${task.status === "pending" ? `<button class="btn btn-small" onclick="updateTaskStatus('${task._id}', 'progress')">Start</button>` : ""}
        ${task.status === "progress" ? `<button class="btn btn-small" onclick="updateTaskStatus('${task._id}', 'completed')">Complete</button>` : ""}
        ${task.status === "completed" ? `<button class="btn btn-small" onclick="updateTaskStatus('${task._id}', 'progress')">Reopen</button>` : ""}
        <button class="btn btn-small btn-secondary" onclick="deleteTask('${task._id}')">Delete</button>
      </div>
    `;
    if (task.status === "pending") pending.appendChild(card);
    if (task.status === "progress") progress.appendChild(card);
    if (task.status === "completed") completed.appendChild(card);
  });
}

function updateStatistics(taskList) {
  const total = taskList.length;
  const pending = taskList.filter(t => t.status === "pending").length;
  const progress = taskList.filter(t => t.status === "progress").length;
  const completed = taskList.filter(t => t.status === "completed").length;

  document.getElementById("totalTasks").textContent = total;
  document.getElementById("pendingTasks").textContent = pending;
  document.getElementById("inProgressTasks").textContent = progress;
  document.getElementById("completedTasks").textContent = completed;
}

// =====================
// NOTIFICATION
// =====================
function showNotification(message, type = "success") {
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.textContent = message;

  const container = document.getElementById("notifications");
  container.appendChild(notification);

  setTimeout(() => notification.remove(), 5000);
}
