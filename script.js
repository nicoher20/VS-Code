// ===== TASK MANAGER APPLICATION =====
// A modern, accessible task management application with local storage persistence.
// Features: CRUD operations, filtering, validation, and keyboard shortcuts.

// ===== DOM ELEMENT REFERENCES =====
const TASK_FORM = document.getElementById('taskForm');
const TASK_INPUT = document.getElementById('taskInput');
const TASK_LIST = document.getElementById('taskList');
const EMPTY_STATE = document.getElementById('emptyState');
const CLEAR_COMPLETED_BTN = document.getElementById('clearCompleted');
const FILTER_BUTTONS = document.querySelectorAll('.filter-btn');
const TOTAL_TASKS_SPAN = document.getElementById('totalTasks');
const COMPLETED_TASKS_SPAN = document.getElementById('completedTasks');
const INPUT_ERROR = document.getElementById('inputError');
const DARK_MODE_TOGGLE = document.getElementById('darkModeToggle');

// ===== APPLICATION STATE =====
let tasks = [];
let currentFilter = 'all';

// ===== VALIDATION CONSTANTS =====
const MAX_TASK_LENGTH = 200;
const FILTER_TYPES = {
    ALL: 'all',
    ACTIVE: 'active',
    COMPLETED: 'completed'
};
const DARK_MODE_KEY = 'darkModeEnabled';

// ===== INITIALIZATION =====
/**
 * Initialize the application on DOM ready.
 * Loads persisted tasks, renders UI, and sets up event listeners.
 */
document.addEventListener('DOMContentLoaded', () => {
    loadDarkModePreference();
    loadTasksFromStorage();
    renderTasks();
    setupEventListeners();
});

// ===== EVENT LISTENERS =====
/**
 * Attach event listeners to form, buttons, and filter controls.
 */
function setupEventListeners() {
    TASK_FORM.addEventListener('submit', handleAddTask);
    CLEAR_COMPLETED_BTN.addEventListener('click', handleClearCompleted);
    DARK_MODE_TOGGLE.addEventListener('click', handleDarkModeToggle);
    FILTER_BUTTONS.forEach(btn => {
        btn.addEventListener('click', (event) => handleFilterChange(event.target.dataset.filter));
    });
    document.addEventListener('keydown', handleKeyboardShortcuts);
}

// ===== ADD TASK =====
/**
 * Handle form submission to add a new task.
 * Validates input (non-empty and character limit), creates task object,
 * persists to storage, and updates UI.
 * @param {Event} event - Form submission event
 */
function handleAddTask(event) {
    event.preventDefault();
    const text = TASK_INPUT.value.trim();

    // Validate: check for empty input
    if (!text) {
        showError('Please enter a task');
        return;
    }

    // Validate: check character limit
    if (text.length > MAX_TASK_LENGTH) {
        showError(`Task must be less than ${MAX_TASK_LENGTH} characters`);
        return;
    }

    hideError();

    // Create new task object with metadata
    const newTask = {
        id: Date.now(),
        text: text,
        completed: false,
        createdAt: new Date().toLocaleString()
    };

    // Add task, persist, and refresh UI
    tasks.push(newTask);
    saveTasksToStorage();
    renderTasks();
    
    // Reset input and restore focus
    TASK_INPUT.value = '';
    TASK_INPUT.focus();
}

// ===== DELETE TASK =====
/**
 * Remove a task from the list by ID.
 * @param {number} id - Task ID to delete
 */
function deleteTask(id) {
    tasks = tasks.filter(task => task.id !== id);
    saveTasksToStorage();
    renderTasks();
}

// ===== TOGGLE TASK COMPLETION =====
/**
 * Toggle the completed status of a task.
 * @param {number} id - Task ID to toggle
 */
function toggleTaskCompletion(id) {
    const task = tasks.find(currentTask => currentTask.id === id);
    if (task) {
        task.completed = !task.completed;
        saveTasksToStorage();
        renderTasks();
    }
}

// ===== CLEAR COMPLETED TASKS =====
/**
 * Remove all completed tasks after user confirmation.
 */
function handleClearCompleted() {
    const completedCount = tasks.filter(task => task.completed).length;
    
    // Exit early if no completed tasks
    if (completedCount === 0) return;

    // Request confirmation with pluralization
    const taskLabel = completedCount === 1 ? 'task' : 'tasks';
    if (confirm(`Delete ${completedCount} completed ${taskLabel}?`)) {
        tasks = tasks.filter(task => !task.completed);
        saveTasksToStorage();
        renderTasks();
    }
}

// ===== FILTER TASKS =====
/**
 * Change the active filter and update UI to reflect the new filter.
 * @param {string} filterType - Filter type: 'all', 'active', or 'completed'
 */
function handleFilterChange(filterType) {
    currentFilter = filterType;
    
    // Update visual feedback for filter buttons
    FILTER_BUTTONS.forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-filter="${filterType}"]`).classList.add('active');
    
    renderTasks();
}

/**
 * Get filtered task list based on current filter selection.
 * @returns {Array} Filtered array of tasks
 */
function getFilteredTasks() {
    switch (currentFilter) {
        case FILTER_TYPES.ACTIVE:
            return tasks.filter(task => !task.completed);
        case FILTER_TYPES.COMPLETED:
            return tasks.filter(task => task.completed);
        case FILTER_TYPES.ALL:
        default:
            return tasks;
    }
}

// ===== RENDER TASKS =====
/**
 * Render all filtered tasks to the DOM.
 * Updates task list, empty state, statistics, and clear button state.
 */
function renderTasks() {
    const filteredTasks = getFilteredTasks();
    TASK_LIST.innerHTML = '';

    // Show empty state if no tasks match current filter
    if (filteredTasks.length === 0) {
        EMPTY_STATE.classList.remove('hidden');
        updateEmptyStateMessage();
    } else {
        EMPTY_STATE.classList.add('hidden');
        filteredTasks.forEach(task => {
            TASK_LIST.appendChild(createTaskElement(task));
        });
    }

    // Update UI components
    updateStats();
    updateClearButtonState();
}

// ===== CREATE TASK ELEMENT =====
/**
 * Create a DOM element for a single task.
 * Includes checkbox, content, and delete button with proper accessibility attributes.
 * @param {Object} task - Task object with id, text, completed, and createdAt properties
 * @returns {HTMLElement} Task list item element
 */
function createTaskElement(task) {
    // Create main list item with completion status styling
    const listItem = document.createElement('li');
    listItem.className = `task-item ${task.completed ? 'completed' : ''}`;
    listItem.setAttribute('data-task-id', task.id);

    // Create completion checkbox with accessibility label
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'task-checkbox';
    checkbox.checked = task.completed;
    const checkboxLabel = task.completed ? 'incomplete' : 'complete';
    checkbox.setAttribute('aria-label', `Mark "${task.text}" as ${checkboxLabel}`);
    checkbox.addEventListener('change', () => toggleTaskCompletion(task.id));

    // Create content section with task text and timestamp
    const content = document.createElement('div');
    content.className = 'task-content';

    const text = document.createElement('p');
    text.className = 'task-text';
    text.textContent = task.text;

    const timestamp = document.createElement('p');
    timestamp.className = 'task-time';
    timestamp.textContent = `Added: ${task.createdAt}`;

    content.appendChild(text);
    content.appendChild(timestamp);

    // Create actions section with delete button
    const actions = document.createElement('div');
    actions.className = 'task-actions';

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'task-btn delete-btn';
    deleteBtn.setAttribute('aria-label', `Delete task "${task.text}"`);
    deleteBtn.textContent = '🗑️';
    deleteBtn.addEventListener('click', () => {
        const confirmDelete = confirm('Are you sure you want to delete this task?');
        if (confirmDelete) {
            deleteTask(task.id);
        }
    });

    actions.appendChild(deleteBtn);

    // Assemble list item
    listItem.appendChild(checkbox);
    listItem.appendChild(content);
    listItem.appendChild(actions);

    return listItem;
}

// ===== UPDATE STATS =====
/**
 * Update task statistics in the footer (total and completed counts).
 */
function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(task => task.completed).length;

    TOTAL_TASKS_SPAN.textContent = `${total} total`;
    COMPLETED_TASKS_SPAN.textContent = `${completed} ${completed === 1 ? 'completed' : 'completed'}`;
}

// ===== UPDATE CLEAR BUTTON STATE =====
/**
 * Enable/disable the "Clear Completed" button based on whether completed tasks exist.
 */
function updateClearButtonState() {
    const hasCompleted = tasks.some(task => task.completed);
    CLEAR_COMPLETED_BTN.disabled = !hasCompleted;
}

// ===== UPDATE EMPTY STATE MESSAGE =====
/**
 * Update the empty state message based on the current filter.
 */
function updateEmptyStateMessage() {
    const emptyText = document.querySelector('.empty-text');
    
    switch (currentFilter) {
        case FILTER_TYPES.COMPLETED:
            emptyText.textContent = 'No completed tasks yet.';
            break;
        case FILTER_TYPES.ACTIVE:
            emptyText.textContent = 'All caught up! No active tasks.';
            break;
        case FILTER_TYPES.ALL:
        default:
            emptyText.textContent = 'No tasks yet. Add one to get started!';
    }
}

// ===== ERROR HANDLING =====
/**
 * Display an error message to the user.
 * @param {string} message - Error message to display
 */
function showError(message) {
    INPUT_ERROR.textContent = message;
    INPUT_ERROR.hidden = false;
}

/**
 * Clear the error message display.
 */
function hideError() {
    INPUT_ERROR.hidden = true;
    INPUT_ERROR.textContent = '';
}

// ===== LOCAL STORAGE PERSISTENCE =====
/**
 * Save tasks to browser local storage.
 * Includes error handling in case storage quota is exceeded.
 */
function saveTasksToStorage() {
    try {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    } catch (error) {
        console.error('Failed to save tasks to storage:', error);
        showError('Failed to save task. Storage may be full.');
    }
}

/**
 * Load tasks from browser local storage with data validation.
 * Filters out invalid task objects to maintain data integrity.
 */
function loadTasksFromStorage() {
    try {
        const stored = localStorage.getItem('tasks');
        tasks = stored ? JSON.parse(stored) : [];
        
        // Validate data structure - filter out corrupt entries
        tasks = tasks.filter(task => 
            task && 
            typeof task.id === 'number' && 
            typeof task.text === 'string' && 
            typeof task.completed === 'boolean'
        );
    } catch (error) {
        console.error('Failed to load tasks from storage:', error);
        tasks = [];
        showError('Failed to load tasks. Starting fresh.');
    }
}

// ===== DARK MODE =====
/**
 * Load dark mode preference from local storage and apply it to the document.
 */
function loadDarkModePreference() {
    try {
        const isDarkModeEnabled = localStorage.getItem(DARK_MODE_KEY) === 'true';
        if (isDarkModeEnabled) {
            document.body.classList.add('dark');
            updateDarkModeIcon();
        }
    } catch (error) {
        console.error('Failed to load dark mode preference:', error);
    }
}

/**
 * Toggle dark mode on and off, persisting the preference.
 */
function handleDarkModeToggle() {
    document.body.classList.toggle('dark');
    const isDarkMode = document.body.classList.contains('dark');
    
    try {
        localStorage.setItem(DARK_MODE_KEY, isDarkMode);
    } catch (error) {
        console.error('Failed to save dark mode preference:', error);
    }
    
    updateDarkModeIcon();
}

/**
 * Update the dark mode toggle button icon based on current theme.
 */
function updateDarkModeIcon() {
    const isDarkMode = document.body.classList.contains('dark');
    const icon = DARK_MODE_TOGGLE.querySelector('.toggle-icon');
    icon.textContent = isDarkMode ? '☀️' : '🌙';
    DARK_MODE_TOGGLE.setAttribute('title', isDarkMode ? 'Switch to light mode' : 'Switch to dark mode');
}

// ===== KEYBOARD SHORTCUTS =====
/**
 * Handle keyboard shortcuts for improved accessibility and usability.
 * Shortcuts:
 *   - Ctrl/Cmd + K: Focus task input field
 *   - Escape: Blur task input field
 * @param {KeyboardEvent} event - Keyboard event object
 */
function handleKeyboardShortcuts(event) {
    // Ctrl/Cmd + K to focus task input
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        TASK_INPUT.focus();
    }

    // Escape to blur input
    if (event.key === 'Escape' && document.activeElement === TASK_INPUT) {
        TASK_INPUT.blur();
    }
}
