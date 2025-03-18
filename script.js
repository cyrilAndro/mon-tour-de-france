document.getElementById("addTraining").addEventListener("click", () => {
    let km = prompt("Nombre de kilomètres ?");
    if (km) {
        localStorage.setItem(new Date().toISOString(), km);
        alert("Entraînement ajouté !");
    }
});

// Affichage des stats (Exemple simplifié)
let data = Object.values(localStorage).map(km => parseFloat(km));
console.log("Données enregistrées :", data);