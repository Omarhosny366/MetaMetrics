// Import Firestore SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js";

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCsMRVlL0WLwuFgCob3ZNe1H7duo_PCaeI",
    authDomain: "metaverseclassroom-484b6.firebaseapp.com",
    projectId: "metaverseclassroom-484b6",
    storageBucket: "metaverseclassroom-484b6.firebasestorage.app",
    messagingSenderId: "350571405779",
    appId: "1:350571405779:web:a5ba74958c78585f808f26",
    measurementId: "G-M6H5E1BCWL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Global Variables
let allSessions = [];
let cumulativeCounts = {};
let sessionDurations = {};
const activitySet = new Set();
const activityDropdown = document.getElementById("activity-dropdown");
const searchInput = document.getElementById("search-input");

// Fetch and Render Data
async function fetchAndRenderStats() {
    const usersRef = collection(db, "users");
    const usersSnapshot = await getDocs(usersRef);

    resetGlobals();

    for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        const activityStatsRef = collection(db, `users/${userId}/activity_stats`);
        const activitySnapshot = await getDocs(activityStatsRef);

        activitySnapshot.forEach((sessionDoc) => {
            const data = sessionDoc.data();

            const session = {
                userId,
                sessionId: data.session_id,
                timestamp: data.timestamp || "N/A",
                sessionDuration: data.session_duration || 0,
                sessionFlow: (data.session_flow || []).join(" -> "),
                activities: data.activity_counts || {}
            };

            // Track session data
            allSessions.push(session);

            // Aggregate durations
            sessionDurations[userId] = (sessionDurations[userId] || 0) + session.sessionDuration;

            // Update activity counts
            for (const [activity, count] of Object.entries(session.activities)) {
                activitySet.add(activity);
                cumulativeCounts[activity] = (cumulativeCounts[activity] || 0) + count;
            }
        });
    }

    populateDropdown();
    renderSessionsTable(allSessions);
    renderCumulativeStats(cumulativeCounts);
    renderHeatmapChart();
    renderDurationChart();
    renderCumulativeChart();
}

// Reset Global Variables
function resetGlobals() {
    allSessions = [];
    cumulativeCounts = {};
    sessionDurations = {};
    activitySet.clear();
    activityDropdown.innerHTML = "<option value='all'>All Activities</option>";
}

// Populate Dropdown Menu
function populateDropdown() {
    activitySet.forEach(activity => {
        const option = document.createElement("option");
        option.value = activity;
        option.textContent = activity;
        activityDropdown.appendChild(option);
    });
}

// Render User Sessions Table
function renderSessionsTable(sessions) {
    const tableBody = document.querySelector("#user-sessions-table tbody");
    tableBody.innerHTML = "";

    sessions.forEach(session => {
        for (const [activity, count] of Object.entries(session.activities)) {
            tableBody.innerHTML += `
                <tr>
                    <td>${session.userId}</td>
                    <td>${session.sessionId}</td>
                    <td>${session.timestamp}</td>
                    <td>${activity}</td>
                    <td>${count}</td>
                    <td>${session.sessionDuration.toFixed(2)}</td>
                    <td>${session.sessionFlow}</td>
                </tr>
            `;
        }
    });
}

// Render Cumulative Statistics Table
function renderCumulativeStats(cumulativeCounts) {
    const tableBody = document.querySelector("#cumulative-stats-table tbody");
    tableBody.innerHTML = "";

    for (const [activity, count] of Object.entries(cumulativeCounts)) {
        tableBody.innerHTML += `
            <tr>
                <td>${activity}</td>
                <td>${count}</td>
            </tr>
        `;
    }
}

// Render Heatmap (Aggregated Activity Count)
function renderHeatmapChart() {
    const ctx = document.getElementById("heatmapChart").getContext("2d");
    const labels = Object.keys(cumulativeCounts);
    const data = Object.values(cumulativeCounts);
    const colors = generateRandomColors(labels.length);

    new Chart(ctx, {
        type: "pie",
        data: { labels: labels, datasets: [{ data: data, backgroundColor: colors }] },
        options: { responsive: true, plugins: { legend: { position: "top" } } }
    });
}

// Render Session Duration Chart
function renderDurationChart() {
    const ctx = document.getElementById("durationChart").getContext("2d");
    const labels = Object.keys(sessionDurations);
    const data = Object.values(sessionDurations);

    new Chart(ctx, {
        type: "bar",
        data: { labels: labels, datasets: [{ label: "Session Durations (seconds)", data: data, backgroundColor: "#4BC0C0" }] },
        options: { responsive: true, scales: { y: { beginAtZero: true } } }
    });
}

// Render Cumulative Trigger Counts Chart
function renderCumulativeChart() {
    const ctx = document.getElementById("cumulativeChart").getContext("2d");
    const labels = Object.keys(cumulativeCounts);
    const data = Object.values(cumulativeCounts);

    new Chart(ctx, {
        type: "bar",
        data: { labels: labels, datasets: [{ label: "Cumulative Trigger Counts", data: data, backgroundColor: "#36A2EB" }] },
        options: { responsive: true, scales: { y: { beginAtZero: true } } }
    });
}

// Search Functionality
searchInput.addEventListener("input", () => {
    const searchValue = searchInput.value.toLowerCase();
    const filteredSessions = allSessions.filter(session =>
        session.userId.toLowerCase().includes(searchValue) 
    );
    renderSessionsTable(filteredSessions);
});

// Dropdown Filter Logic
activityDropdown.addEventListener("change", () => {
    const selectedActivity = activityDropdown.value;
    if (selectedActivity === "all") {
        renderSessionsTable(allSessions);
    } else {
        const filteredSessions = allSessions.filter(session =>
            Object.keys(session.activities).includes(selectedActivity)
        );
        renderSessionsTable(filteredSessions);
    }
});

// Utility: Generate Random Colors
function generateRandomColors(numColors) {
    return Array.from({ length: numColors }, () => `hsl(${Math.random() * 360}, 70%, 60%)`);
}

// Load Data on Page Load
document.addEventListener("DOMContentLoaded", fetchAndRenderStats);
