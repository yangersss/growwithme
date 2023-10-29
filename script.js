let totalSeeds = 0;
let totalOxygen = 0;  // Initialize totalOxygen
let tasks = [];

// -----------------------------
// Initialization and Utilities
// -----------------------------

function formatNumber(num) {
    if (num < 1e6) return num.toLocaleString();
    if (num < 1e9) return (num / 1e6).toFixed(2) + ' million';
    if (num < 1e12) return (num / 1e9).toFixed(2) + ' billion';
    if (num < 1e15) return (num / 1e12).toFixed(2) + ' trillion';
    return num.toLocaleString();
}

function updateSeedCount() {
    const seedCounterTask = document.getElementById('seed-count');
    seedCounterTask.textContent = totalSeeds;

    const seedCounterGame = document.getElementById('seed-count-game');
    seedCounterGame.textContent = totalSeeds;
}

function updateOxygenCount() {
    document.getElementById('oxygen-count').textContent = `${formatNumber(totalOxygen)}`;
}

// -----------------------------
// Local Storage Operations
// -----------------------------

function saveTasksToLocalStorage() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
    localStorage.setItem('totalSeeds', totalSeeds.toString());
    localStorage.setItem('totalOxygen', totalOxygen.toString());  // Save totalOxygen
}

function loadTasksFromLocalStorage() {
    const storedTasks = localStorage.getItem('tasks');
    const storedSeeds = localStorage.getItem('totalSeeds');
    const storedOxygen = localStorage.getItem('totalOxygen');  // Load storedOxygen

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
    if (storedOxygen !== null) {
        totalOxygen = parseInt(storedOxygen);
    }

    updateOxygenCount();
}

// -----------------------------
// Task List Operations
// -----------------------------

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

// -----------------------------
// Game Screen Operations
// -----------------------------

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

const baseOxygenCosts = [0, 15, 100, 1100, 12000];
const factories = baseOxygenCosts.map((baseCost, idx) => {
    return {
        name: ['Algae', 'Moss', 'Succulent', 'Fern', 'Shrub'][idx],
        seedCost: 1,
        baseOxygenCost: baseCost,
        oxygenCost: baseCost,
        owned: 0,
        oxygenProduction: [0.05, 0.1, 1, 8, 47][idx]
    };
});

function displayFactories() {
    const factoryContainer = document.getElementById('factories');
    factories.forEach(factory => {
        const factoryDiv = document.createElement('div');
        factoryDiv.className = 'factory-item';

        const name = document.createElement('span');
        name.textContent = factory.name;
        factoryDiv.appendChild(name);

        const owned = document.createElement('span');
        owned.className = 'factory-owned';
        owned.textContent = `Owned: ${factory.owned}`;
        factoryDiv.appendChild(owned);

        const buyButton = document.createElement('button');
        buyButton.textContent = `Buy for ${factory.seedCost} seed(s) and ${Math.round(factory.oxygenCost)} oxygen`;
        buyButton.addEventListener('click', () => purchaseFactory(factory));
        factoryDiv.appendChild(buyButton);

        factoryContainer.appendChild(factoryDiv);
    });
}

function purchaseFactory(factory) {
    if (totalSeeds >= factory.seedCost && totalOxygen >= factory.oxygenCost) {
        totalSeeds -= factory.seedCost;
        totalOxygen -= factory.oxygenCost;
        factory.owned++;

        // Update the factory cost after purchasing
        factory.oxygenCost = Math.round(factory.baseOxygenCost * (1.15 ** factory.owned));

        updateSeedCount();
        updateOxygenCount();
        updateFactoryDisplay(factory);  // Call this to update owned count and price in the display
    } else {
        alert("Not enough resources!");
    }
}

function updateFactoryDisplay(factory) {
    console.log(`Updating display for ${factory.name}`);
    const factoriesDOM = document.querySelectorAll('.factory-item');
    factoriesDOM.forEach(factoryDOM => {
        if (factoryDOM.querySelector('span').textContent === factory.name) {
            factoryDOM.querySelector('.factory-owned').textContent = `Owned: ${factory.owned}`;
            const buyButton = factoryDOM.querySelector('button');
            buyButton.textContent = `Buy for ${factory.seedCost} seed(s) and ${factory.oxygenCost} oxygen`;
        }
    });
}

function updateOxygenProduction() {
    factories.forEach(factory => {
        totalOxygen += factory.oxygenProduction * factory.owned;
    });
    updateOxygenCount();  // Update the displayed oxygen count
}

const plants = [
    { name: "Spider plant", oxygenCost: 1e1, purchased: false },
    { name: "Beets", oxygenCost: 1e4, purchased: false },
    { name: "Basil", oxygenCost: 1e5, purchased: false },
    { name: "Snake plant", oxygenCost: 1e6, purchased: false },
    { name: "Pothos", oxygenCost: 1e7, purchased: false }
];

function displayPlants() {
    const plantContainer = document.getElementById('plants');
    plants.forEach(plant => {
        const plantDiv = document.createElement('div');
        plantDiv.className = 'plant-item';

        const name = document.createElement('span');
        name.textContent = plant.name;
        plantDiv.appendChild(name);

        const buyButton = document.createElement('button');
        if (plant.purchased) {
            buyButton.textContent = `Purchased`;
            buyButton.disabled = true;
        } else {
            buyButton.textContent = `Buy for ${formatNumber(plant.oxygenCost)} oxygen`;
            buyButton.addEventListener('click', () => purchasePlant(plant));
        }
        plantDiv.appendChild(buyButton);

        plantContainer.appendChild(plantDiv);
    });
}

function purchasePlant(plant) {
    if (totalOxygen >= plant.oxygenCost) {
        totalOxygen -= plant.oxygenCost;
        plant.purchased = true;
        
        updateOxygenCount();
        updatePlantButton(plant); // Call to update the plant's button
    } else {
        alert("Not enough oxygen!");
    }
}

function updatePlantButton(plant) {
    const plantContainer = document.getElementById('plants');
    const plantItems = plantContainer.querySelectorAll('.plant-item');

    plantItems.forEach(plantItem => {
        const nameSpan = plantItem.querySelector('span');
        if (nameSpan.textContent === plant.name) {
            const buyButton = plantItem.querySelector('button');
            buyButton.textContent = `Purchased`;
            buyButton.disabled = true;
            buyButton.removeEventListener('click', () => purchasePlant(plant));
        }
    });
}

window.onload = function () {
    loadTasksFromLocalStorage();
    updateSeedCount();
    updateOxygenCount();
    displayFactories();
    displayPlants(); // Display the available plants
    setInterval(updateOxygenProduction, 50);
}