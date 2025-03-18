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
        displayStats(trainings);
    };
}

// Affichage des statistiques avec filtre
document.getElementById("filter").addEventListener("change", function() {
    loadTrainings();
});

// Afficher les stats selon le filtre sélectionné
function displayStats(trainings) {
    let filter = document.getElementById("filter").value;
    let filteredData = {};
    let now = new Date();

    trainings.forEach(training => {
        let date = new Date(training.date);
        let label;

        if (filter === "week" && (now - date) / (1000 * 60 * 60 * 24) <= 7) {
            label = "Cette semaine";
        } else if (filter === "month" && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()) {
            label = "Ce mois";
        } else if (filter === "year" && date.getFullYear() === now.getFullYear()) {
            label = "Cette année";
        } else {
            return;
        }

        filteredData[label] = (filteredData[label] || 0) + training.km;
    });

    updateChart(Object.keys(filteredData), Object.values(filteredData));
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
}