/// Ouvrir IndexedDB
let db;
const request = indexedDB.open("trainingsDB", 1);

request.onupgradeneeded = function(event) {
    db = event.target.result;
    db.createObjectStore("trainings", { keyPath: "id", autoIncrement: true });
};

request.onsuccess = function(event) {
    db = event.target.result;
    loadTrainings();
};

// Gérer le formulaire
document.getElementById("trainingForm").addEventListener("submit", function(event) {
    event.preventDefault();

    let km = parseFloat(document.getElementById("km").value);
    let duration = parseInt(document.getElementById("duration").value);
    let difficulty = Array.from(document.querySelectorAll("input[name='difficulty']:checked"))
                      .map(input => input.value)
                      .join(", "); // Convertit la sélection en une chaîne séparée par des virgules
    let date = new Date().toISOString().split('T')[0];

    if (km && duration) {
        let training = { date, km, duration, difficulty }; // Enregistre plusieurs niveaux


        let tx = db.transaction("trainings", "readwrite");
        let store = tx.objectStore("trainings");
        store.add(training);

        tx.oncomplete = function() {
            alert("Entraînement ajouté !");
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
        console.log("Données récupérées :", trainings);
        displayTrainings(trainings);
    };
}

// Afficher les entraînements dans le tableau
function displayTrainings(trainings) {
    let tbody = document.getElementById("trainingTable").getElementsByTagName("tbody")[0];
    tbody.innerHTML = ""; // Effacer les anciennes entrées

    if (trainings.length === 0) {
        console.log("Aucun entraînement trouvé !");
        return;
    }

    trainings.forEach(training => {
        let row = tbody.insertRow();
        row.insertCell(0).innerText = training.date;
        row.insertCell(1).innerText = training.km;
        row.insertCell(2).innerText = training.duration;
        row.insertCell(3).innerText = training.difficulty;

        let deleteCell = row.insertCell(4);
        let deleteButton = document.createElement("button");
        deleteButton.innerText = "🗑️";
        deleteButton.className = "delete";
        deleteButton.onclick = function() { deleteTraining(training.id); };
        deleteCell.appendChild(deleteButton);
    });

    console.log("Tableau mis à jour !");
}




// Calculer les totaux par semaine, mois et année
function displayTotals(trainings) {
    let weeklyTotal = 0, monthlyTotal = 0, yearlyTotal = 0;
    let weeklyHours = 0, monthlyHours = 0, yearlyHours = 0;
    let now = new Date();

    trainings.forEach(training => {
        let date = new Date(training.date);
        let km = parseFloat(training.km);
        let duration = parseInt(training.duration);

        if ((now - date) / (1000 * 60 * 60 * 24) <= 7) {
            weeklyTotal += km;
            weeklyHours += duration;
        }
        if (date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()) {
            monthlyTotal += km;
            monthlyHours += duration;
        }
        if (date.getFullYear() === now.getFullYear()) {
            yearlyTotal += km;
            yearlyHours += duration;
        }
    });

    document.getElementById("weeklyTotal").innerText = `Km: ${weeklyTotal}, Heures: ${weeklyHours}`;
    document.getElementById("monthlyTotal").innerText = `Km: ${monthlyTotal}, Heures: ${monthlyHours}`;
    document.getElementById("yearlyTotal").innerText = `Km: ${yearlyTotal}, Heures: ${yearlyHours}`;
}
}

// Affichage des statistiques avec filtre
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
            loadTrainings(); // Recharge immédiatement les entraînements
        };
    }
});


// Afficher les stats selon le filtre sélectionné
function displayTrainings(trainings) {
    let tbody = document.getElementById("trainingTable").getElementsByTagName("tbody")[0];
    tbody.innerHTML = ""; // Effacer les anciennes entrées

    trainings.forEach(training => {
        let row = tbody.insertRow();
        row.insertCell(0).innerText = training.date;
        row.insertCell(1).innerText = training.km;
        row.insertCell(2).innerText = training.duration;
        row.insertCell(3).innerText = training.difficulty;

        let deleteCell = row.insertCell(4);
        let deleteButton = document.createElement("button");
        deleteButton.innerText = "🗑️";
        deleteButton.style.color = "red";
        deleteButton.onclick = function() { deleteTraining(training.id); };
        deleteCell.appendChild(deleteButton);
    });
}

// Mettre à jour le graphique
function updateChart(labels, data) {
    let ctx = document.getElementById("statsChart").getContext("2d");
    if (window.chart) window.chart.destroy();
    window.chart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: labels,
            datasets: [{ label: "Kilomètres parcourus", data: data, backgroundColor: "blue" }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });

// Supprimer un entraînement
function deleteTraining(id) {
    let tx = db.transaction("trainings", "readwrite");
    let store = tx.objectStore("trainings");
    store.delete(id);

    tx.oncomplete = function() {
        console.log("Entraînement supprimé :", id);
        loadTrainings(); // Recharge le tableau après suppression
    };
}
}