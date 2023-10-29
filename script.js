let totalSeeds = 0;
let totalOxygen = 0;  // Initialize totalOxygen
let tasks = [];

// -----------------------------
// Utilities
// -----------------------------

function formatNumber(num) {
    if (num < 1e6) return num.toLocaleString();
    if (num < 1e9) return (num / 1e6).toFixed(2) + ' million';
    if (num < 1e12) return (num / 1e9).toFixed(2) + ' billion';
    if (num < 1e15) return (num / 1e12).toFixed(2) + ' trillion';
    return num.toLocaleString();
}

function setInnerText(id, text) {
    document.getElementById(id).textContent = text;
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

function saveToLocalStorage() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
    localStorage.setItem('totalSeeds', totalSeeds.toString());
    localStorage.setItem('totalOxygen', totalOxygen.toString());
    localStorage.setItem('factories', JSON.stringify(factories));
    localStorage.setItem('plants', JSON.stringify(plants));

}

function loadFromLocalStorage() {
    const storedTasks = localStorage.getItem('tasks');
    const storedSeeds = localStorage.getItem('totalSeeds');
    const storedOxygen = localStorage.getItem('totalOxygen');

    if (storedTasks) {
        const parsedTasks = JSON.parse(storedTasks);
        tasks.push(...parsedTasks);
        parsedTasks.forEach(task => {
            addTaskToList(task.text, task.seeds, task.checked, false);
            if (task.checked) totalSeeds += parseInt(task.seeds);
        });
    }

    if (storedSeeds) totalSeeds = parseInt(storedSeeds);
    if (storedOxygen) totalOxygen = parseInt(storedOxygen);

    updateOxygenCount();
    
    // Load factories
    const storedFactories = localStorage.getItem('factories');
    if (storedFactories) {
        const parsedFactories = JSON.parse(storedFactories);
        for (let i = 0; i < factories.length; i++) {
            factories[i].owned = parsedFactories[i].owned;
            factories[i].oxygenCost = parsedFactories[i].oxygenCost;
        }
    }

    // Load plants
    const storedPlants = localStorage.getItem('plants');
    if (storedPlants) {
        const parsedPlants = JSON.parse(storedPlants);
        for (let i = 0; i < plants.length; i++) {
            plants[i].purchased = parsedPlants[i].purchased;
        }
    }
}

// -----------------------------
// Debug Operations
// -----------------------------

function gameReset() {
    totalSeeds = 0;
    totalOxygen = 0;

    // Resetting factories
    factories.forEach(factory => {
        factory.owned = 0;
        factory.oxygenCost = factory.baseOxygenCost;
    });

    plants.forEach(plant => plant.purchased = false);

    // Clear out shop and factories HTML containers
    const shopContainer = document.getElementById('plant-shop');
    const factoryContainer = document.getElementById('factories');

    shopContainer.innerHTML = '';
    factoryContainer.innerHTML = '';

    updateSeedCount();
    updateOxygenCount();
    updateOPS();

    saveToLocalStorage();
    // Refresh the page to reflect the changes
    location.reload();
}

function maxResources() {
    totalSeeds = 1e15;  // This will set the seeds to a very large number, you can adjust as needed
    totalOxygen = 1e15;  // This will set the oxygen to a very large number, you can adjust as needed
    updateSeedCount();
    updateOxygenCount();
    saveToLocalStorage();
}

document.getElementById('game-reset').addEventListener('click', gameReset);
document.getElementById('max-resources').addEventListener('click', maxResources);

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
        tasks.push({ text, seeds, checked });
        saveToLocalStorage();
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
// Game Operations
// -----------------------------

function toggleEnvironment(screenId) {
    const screens = {
        'debug-screen': document.getElementById('debug-screen'),
        'task-screen': document.getElementById('task-screen'),
        'game-screen': document.getElementById('game-screen')
    };

    Object.keys(screens).forEach(key => {
        screens[key].style.display = key === screenId ? 'block' : 'none';
    });
}

//Factories

const baseOxygenCosts = [0, 15, 100, 1100, 12000, 130000, 1.4e6, 2e7, 3.3e8];
const factoryNames = ['Algae', 'Moss', 'Succulent', 'Fern', 'Shrub', 'Dogwood', 'Palm', 'Oak', 'Coastal redwood'];
const factoryOxygenProd = [0.05, 0.1, 1, 8, 47, 260, 1400, 7800, 44000];
const factories = baseOxygenCosts.map((baseCost, idx) => {
    return {
        name: factoryNames[idx],
        seedCost: 1,
        baseOxygenCost: baseCost,
        oxygenCost: baseCost,
        owned: 0,
        oxygenProduction: factoryOxygenProd[idx]
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
        // Use formatNumber to display the oxygen cost
        buyButton.textContent = `Buy for ${factory.seedCost} seed(s) and ${formatNumber(factory.oxygenCost)} oxygen`;
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
        updateOPS();
        saveToLocalStorage();
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
            // Use formatNumber to update the displayed oxygen cost
            buyButton.textContent = `Buy for ${factory.seedCost} seed(s) and ${formatNumber(factory.oxygenCost)} oxygen`;
        }
    });
}

function updateOxygenProduction() {
    factories.forEach(factory => totalOxygen += factory.oxygenProduction * factory.owned);
    updateOxygenCount();
    updateOPS();
}

function calculateOxygenPerSecond() {
    return factories.reduce((acc, factory) => acc + (factory.oxygenProduction * factory.owned), 0);
}

function updateOPS() {
    setInnerText('oxygen-per-second', formatNumber(calculateOxygenPerSecond()));
}

//Plants

const plants = [
    { name: "Spider plant", oxygenCost: 1e1, purchased: false },
    { name: "Beets", oxygenCost: 1e4, purchased: false },
    { name: "Basil", oxygenCost: 1e5, purchased: false },
    { name: "Snake plant", oxygenCost: 1e6, purchased: false },
    { name: "Pothos", oxygenCost: 1e7, purchased: false },
    { name: "Mint", oxygenCost: 1e8, purchased: false },
    { name: "Peace lily", oxygenCost: 1e9, purchased: false },
    { name: "Bonsai tree", oxygenCost: 1e10, purchased: false },
    { name: "Apple tree", oxygenCost: 1e11, purchased: false },
    { name: "Lemon tree", oxygenCost: 1e12, purchased: false },
    { name: "Glowing alien plant", oxygenCost: 1e13, purchased: false }
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
        saveToLocalStorage();
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

// Initialization

window.onload = function () {
    loadFromLocalStorage();
    setInnerText('seed-count', totalSeeds);
    setInnerText('seed-count-game', totalSeeds);
    updateOxygenCount();
    displayFactories();
    displayPlants();
    updateOPS();
    setInterval(updateOxygenProduction, 50);
}