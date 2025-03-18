// Ouvrir IndexedDB pour stocker les entraînements
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

// Ajouter un entraînement
document.getElementById("addTraining").addEventListener("click", () => {
    let km = parseFloat(prompt("Nombre de kilomètres ?"));
    let difficulty = prompt("Difficulté (n1 à n6) ?");
    let notes = prompt("Notes supplémentaires ?");
    let date = new Date().toISOString().split('T')[0]; // Format YYYY-MM-DD

    if (km && difficulty) {
        let training = { date, km, difficulty, notes };

        let tx = db.transaction("trainings", "readwrite");
        let store = tx.objectStore("trainings");
        store.add(training);

        tx.oncomplete = function() {
            alert("Entraînement ajouté !");
            loadTrainings();
        };
    }
});

// Charger les entraînements et mettre à jour les stats
function loadTrainings() {
    let tx = db.transaction("trainings", "readonly");
    let store = tx.objectStore("trainings");
    let request = store.getAll();

    request.onsuccess = function(event) {
        let trainings = event.target.result;
        displayStats(trainings);
    };
}

// Affichage des stats sous forme de graphique
function displayStats(trainings) {
    let weeklyData = {};
    let monthlyData = {};

    trainings.forEach(training => {
        let [year, month, day] = training.date.split('-');
        let week = `${year}-W${Math.ceil(day / 7)}`;

        weeklyData[week] = (weeklyData[week] || 0) + training.km;
        monthlyData[`${year}-${month}`] = (monthlyData[`${year}-${month}`] || 0) + training.km;
    });

    updateChart(Object.keys(weeklyData), Object.values(weeklyData), "weeklyChart");
    updateChart(Object.keys(monthlyData), Object.values(monthlyData), "monthlyChart");
}

// Mettre à jour un graphique
function updateChart(labels, data, chartId) {
    let ctx = document.getElementById(chartId).getContext("2d");
    new Chart(ctx, {
        type: "bar",
        data: {
            labels: labels,
            datasets: [{ label: "Kilomètres", data: data, backgroundColor: "blue" }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}