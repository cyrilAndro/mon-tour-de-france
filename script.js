// Ouvrir IndexedDB
let db;
const request = indexedDB.open("trainingsDB", 1);

request.onupgradeneeded = function(event) {
    db = event.target.result;
    db.createObjectStore("trainings", { keyPath: "id", autoIncrement: true });
};

request.onsuccess = function(event) {
    db = event.target.result;
    if (db) {
        loadTrainings();
    } else {
        console.error("Erreur : IndexedDB non initialisé.");
    }
};

// Gérer l'ajout d'un entraînement
document.getElementById("trainingForm").addEventListener("submit", function(event) {
    event.preventDefault();

    let km = parseFloat(document.getElementById("km").value);
    let duration = parseInt(document.getElementById("duration").value);
    let difficulty = Array.from(document.querySelectorAll("input[name='difficulty']:checked"))
                          .map(input => input.value)
                          .join(", ");
    let date = new Date().toISOString().split('T')[0];

    if (km && duration) {
        let training = { id: Date.now(), date, km, duration, difficulty };

        let tx = db.transaction("trainings", "readwrite");
        let store = tx.objectStore("trainings");
        store.add(training);

        tx.oncomplete = function() {
            console.log("Entraînement ajouté :", training);
            document.getElementById("trainingForm").reset();
            loadTrainings();
        };
    }
});

// Charger les entraînements
function loadTrainings() {
    let tx = db.transaction("trainings", "readonly");
    let store = tx.objectStore("trainings");
    let request = store.getAll();

    request.onsuccess = function(event) {
        let trainings = event.target.result;
        displayTrainings(trainings);
        displayTotals(trainings);
    };
}

// Afficher les entraînements
function displayTrainings(trainings) {
    let tbody = document.querySelector("#trainingTable tbody");
    tbody.innerHTML = "";

    trainings.forEach(training => {
        let row = tbody.insertRow();
        row.insertCell(0).innerText = training.date;
        row.insertCell(1).innerText = training.km;
        row.insertCell(2).innerText = training.duration;
        row.insertCell(3).innerText = training.difficulty;

        let deleteCell = row.insertCell(4);
        let deleteButton = document.createElement("button");
        deleteButton.innerText = "🗑️";
        deleteButton.onclick = () => deleteTraining(training.id);
        deleteCell.appendChild(deleteButton);
    });
}

// Supprimer un entraînement
function deleteTraining(id) {
    let tx = db.transaction("trainings", "readwrite");
    let store = tx.objectStore("trainings");
    store.delete(id);

    tx.oncomplete = function() {
        console.log("Entraînement supprimé :", id);
        loadTrainings();
    };
}

// Calculer les totaux
function displayTotals(trainings) {
    let now = new Date();
    let weeklyTotal = 0, monthlyTotal = 0, yearlyTotal = 0;

    trainings.forEach(training => {
        let date = new Date(training.date);
        let km = parseFloat(training.km);

        if ((now - date) / (1000 * 60 * 60 * 24) <= 7) weeklyTotal += km;
        if (date.getMonth() === now.getMonth()) monthlyTotal += km;
        if (date.getFullYear() === now.getFullYear()) yearlyTotal += km;
    });

    document.getElementById("weeklyTotal").innerText = `Km: ${weeklyTotal}`;
    document.getElementById("monthlyTotal").innerText = `Km: ${monthlyTotal}`;
    document.getElementById("yearlyTotal").innerText = `Km: ${yearlyTotal}`;
}
