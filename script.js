let totalSeeds = 0;
let tasks = [];

window.onload = function () {
    loadTasksFromLocalStorage();
    updateSeedCount();
}

function saveTasksToLocalStorage() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
    localStorage.setItem('totalSeeds', totalSeeds.toString());
}

function loadTasksFromLocalStorage() {
    const storedTasks = localStorage.getItem('tasks');
    const storedSeeds = localStorage.getItem('totalSeeds');

    if (storedTasks !== null) {
        tasks = JSON.parse(storedTasks);
        tasks.forEach(task => {
            addTaskToList(task.text, task.seeds, task.checked, false);
            if (task.checked) {
                totalSeeds += parseInt(task.seeds);
            }
        });
    }

    if (storedSeeds !== null) {
        totalSeeds = parseInt(storedSeeds);
    }
}

function addTaskToList(text, seeds, checked = false, saveToStorage = true) {
    const taskList = document.getElementById('task-list');

    const li = document.createElement('li');

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = checked;
    checkbox.className = 'task-check';
    checkbox.setAttribute('data-seeds', seeds);
    checkbox.addEventListener('change', function () {
        const seedValue = Number(this.getAttribute('data-seeds'));
        if (this.checked) {
            totalSeeds += seedValue;
        } else {
            totalSeeds -= seedValue;
        }
        updateSeedCount();
        taskSpan.classList.toggle('checked', this.checked);

        const taskIndex = tasks.findIndex(task => task.text === text && task.seeds === seeds);
        tasks[taskIndex].checked = this.checked;
        saveTasksToLocalStorage();
    });
    li.appendChild(checkbox);

    const taskSpan = document.createElement('span');
    taskSpan.className = 'task-text';
    taskSpan.textContent = text + " (" + seeds + " seeds)";
    li.appendChild(taskSpan);

    taskList.appendChild(li);

    if (saveToStorage) {
        tasks.push({ text: text, seeds: seeds, checked: checked });
        saveTasksToLocalStorage();
    }
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = "Delete";
    deleteBtn.className = 'delete-btn';
    deleteBtn.addEventListener('click', function () {
        // Remove the task from the DOM
        taskList.removeChild(li);

        // Update tasks array and save to localStorage
        tasks = tasks.filter(task => task.text !== text || task.seeds !== seeds);
        saveTasksToLocalStorage();

        // Update seed count if the task was checked
        if (checked) {
            totalSeeds -= parseInt(seeds);
            updateSeedCount();
        }
    });
    li.appendChild(deleteBtn);
}

function addTask() {
    const taskInput = document.getElementById('task-input');
    const seedInput = document.getElementById('seed-input');
    const seedValue = parseInt(seedInput.value);

    if (taskInput.value.trim() !== "" 
        && Number.isInteger(seedValue) 
        && seedValue >= -7 
        && seedValue <= 7) {
        addTaskToList(taskInput.value, seedValue);
        taskInput.value = '';
        seedInput.value = '';
    } else {
        alert("Please ensure the seed value is an integer between -7 and 7.");
    }
}


function toggleEnvironment(screenId) {
    let taskScreen = document.getElementById('task-screen');
    let gameScreen = document.getElementById('game-screen');

    if (screenId === 'task-screen') {
        taskScreen.style.display = 'block';
        gameScreen.style.display = 'none';
    } else if (screenId === 'game-screen') {
        gameScreen.style.display = 'block';
        taskScreen.style.display = 'none';
    }
}

function updateSeedCount() {
    const seedCounter = document.getElementById('seed-count');
    seedCounter.textContent = totalSeeds;
}

function startNewDay() {
    // Get all checked checkboxes
    const checkedCheckboxes = document.querySelectorAll('.task-check:checked');

    // Uncheck each checkbox
    checkedCheckboxes.forEach(checkbox => {
        checkbox.checked = false;
        
        // Update associated task span class
        const taskSpan = checkbox.nextSibling;
        taskSpan.classList.toggle('checked', checkbox.checked);

        // Update tasks array
        const seedValue = Number(checkbox.getAttribute('data-seeds'));
        const taskText = taskSpan.textContent.replace(` (${seedValue} seeds)`, '');
        const taskIndex = tasks.findIndex(task => task.text === taskText && task.seeds === seedValue);
        tasks[taskIndex].checked = checkbox.checked;
    });

    // Save tasks to local storage
    saveTasksToLocalStorage();
}
