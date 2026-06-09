// 1. IMPORT FIREBASE DEPLOYMENT DEPENDENCIES
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getDatabase, ref, push, onValue, remove, set } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

// 2. RUN ENVIRONMENT CONNECTIVITY OBJECT CONFIGURATION
const firebaseConfig = {
    apiKey: "AIzaSyDM6LQot13YiVFdkGAEzOyz0yGBP7aasl4",
    authDomain: "expensetracker-7ae23.firebaseapp.com",
    databaseURL: "https://expensetracker-7ae23-default-rtdb.firebaseio.com/",
    projectId: "expensetracker-7ae23",
    storageBucket: "expensetracker-7ae23.firebasestorage.app",
    messagingSenderId: "338160391556",
    appId: "1:338160391556:web:78b0782e20cf95b3b8b9d1"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// 3. CACHE INTERACTIVE DOM INTERFACE POINTERS
const loginScreen = document.getElementById("login-screen");
const appContainer = document.getElementById("app-container");
const loginBtn = document.getElementById("google-login-btn");
const logoutBtn = document.getElementById("logout-btn");
const welcomeText = document.getElementById("welcome-text");

const nameInput = document.getElementById("expense-name");
const amountInput = document.getElementById("expense-amount");
const categoryInput = document.getElementById("expense-category");
const addButton = document.getElementById("add-btn");
const expenseList = document.getElementById("expense-list");
const totalDisplay = document.getElementById("total-amount");
const budgetInput = document.getElementById("budget-input");
const progressFill = document.getElementById("progress-fill");

// Global Application Core State Anchors
let editingItemID = null;
let currentUserID = null;
let expensesInDB = null;
let budgetInDB = null;
let runningTotal = 0;
let currentBudget = 0;

// 4. HANDSHAKE INFRASTRUCTURE AUTH EVENTS
loginBtn.addEventListener("click", () => {
    signInWithPopup(auth, googleProvider).catch((error) => console.error("Login failed:", error));
});

logoutBtn.addEventListener("click", () => {
    signOut(auth).catch((error) => console.error("Logout failed:", error));
});

// Structural Security Observability Broker Chain
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUserID = user.uid;

        loginScreen.style.display = "none";
        appContainer.style.display = "block";
        welcomeText.textContent = `Welcome back, ${user.displayName.split(" ")[0]}!`;

        expensesInDB = ref(database, `users/${currentUserID}/personal_expenses`);
        budgetInDB = ref(database, `users/${currentUserID}/budget`);

        loadUserData();

    } else {
        currentUserID = null;
        expensesInDB = null;
        budgetInDB = null;
        runningTotal = 0;
        currentBudget = 0;

        loginScreen.style.display = "flex";
        appContainer.style.display = "none";

        expenseList.innerHTML = "";
        totalDisplay.textContent = "₹0.00";
        budgetInput.value = "";
        progressFill.style.width = "0%";
        progressFill.style.setProperty('background-color', '#64748b', 'important');
    }
});

// 5. ASYNC PERSISTENCE AND PARSING STRATEGIES
function loadUserData() {

    // Capture mutations on local input elements
    budgetInput.addEventListener("change", function () {
        const targetBudget = parseFloat(budgetInput.value) || 0;
        set(budgetInDB, targetBudget);
    });

    // Subscribed state broker listener matrices
    onValue(budgetInDB, function (snapshot) {
        if (snapshot.exists()) {
            currentBudget = parseFloat(snapshot.val()) || 0;
            budgetInput.value = currentBudget;
        } else {
            currentBudget = 0;
            budgetInput.value = "";
        }
        updateBudgetVisuals();
    });

    onValue(expensesInDB, function (snapshot) {
        if (snapshot.exists()) {
            let itemsArray = Object.entries(snapshot.val());
            expenseList.innerHTML = "";
            runningTotal = 0;

            for (let i = itemsArray.length - 1; i >= 0; i--) {
                let currentItem = itemsArray[i];
                let currentItemID = currentItem[0];
                let itemData = currentItem[1];

                runningTotal += parseFloat(itemData.amount);

                let newEl = document.createElement("li");
                let textContainer = document.createElement("div");
                textContainer.className = "item-info";
                let displayCategory = itemData.category ?? "📦 Other";

                textContainer.innerHTML = `
                    <div>
                        <span class="category-tag">${displayCategory}</span>
                        <span class="item-title">${itemData.name}</span>
                    </div>
                    <span class="item-cost">₹${parseFloat(itemData.amount).toFixed(2)}</span>
                `;

                let actionDiv = document.createElement("div");
                actionDiv.className = "action-buttons";

                let editBtn = document.createElement("button");
                editBtn.className = "edit-btn";
                editBtn.textContent = "✏️";
                editBtn.addEventListener("click", function () {
                    nameInput.value = itemData.name;
                    amountInput.value = itemData.amount;
                    categoryInput.value = displayCategory;
                    editingItemID = currentItemID;
                    addButton.textContent = "Update Expense 💾";
                    addButton.style.backgroundColor = "#0284c7";
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                });

                let deleteBtn = document.createElement("button");
                deleteBtn.className = "delete-btn";
                deleteBtn.textContent = "🗑️";
                deleteBtn.addEventListener("click", function () {
                    remove(ref(database, `users/${currentUserID}/personal_expenses/${currentItemID}`));
                });

                actionDiv.append(editBtn, deleteBtn);
                newEl.append(textContainer, actionDiv);
                expenseList.append(newEl);
            }

            totalDisplay.textContent = `₹${runningTotal.toFixed(2)}`;
            updateBudgetVisuals();

        } else {
            expenseList.innerHTML = "<li style='justify-content: center; color: #94a3b8; font-size: 14px;'>No items logged yet! ✨</li>";
            totalDisplay.textContent = "₹0.00";
            runningTotal = 0;
            updateBudgetVisuals();
        }
    });
}

// 6. VOLUMETRIC UI COMPONENT FILL CALCULATOR (Fixed Explicit Inline Properties)
function updateBudgetVisuals() {
    if (currentBudget === 0) {
        progressFill.style.width = "0%";
        progressFill.style.setProperty('background-color', '#64748b', 'important');
        return;
    }

    const percentage = (runningTotal / currentBudget) * 100;

    // Set width threshold safely
    progressFill.style.width = `${Math.min(percentage, 100)}%`;

    // Ensure baseline class initialization stays constant
    progressFill.removeAttribute("class");
    progressFill.classList.add("progress-fill");

    // Dynamic Style Override Injection
    if (percentage >= 100) {
        progressFill.style.setProperty('background-color', '#EA4335', 'important'); // Over Limit (Red)
    } else if (percentage >= 80) {
        progressFill.style.setProperty('background-color', '#FBBC05', 'important'); // Warning Zone (Orange/Amber)
    } else {
        progressFill.style.setProperty('background-color', '#34A853', 'important'); // Under Limit Safe (Green)
    }
}

// 7. TRANSACTION INPUT CONTROLLER MUTATIONS
addButton.addEventListener("click", function () {
    if (!currentUserID) return;

    let expenseName = nameInput.value.trim();
    let expenseAmount = parseFloat(amountInput.value);
    let expenseCategory = categoryInput.value;

    if (expenseName && !isNaN(expenseAmount) && expenseAmount > 0) {

        let expenseData = {
            name: expenseName,
            amount: expenseAmount,
            category: expenseCategory
        };

        if (editingItemID === null) {
            push(expensesInDB, expenseData);
        } else {
            let exactLocation = ref(database, `users/${currentUserID}/personal_expenses/${editingItemID}`);
            set(exactLocation, expenseData);

            editingItemID = null;
            addButton.textContent = "Log Expense ➜";
            addButton.style.backgroundColor = "#1e293b";
        }

        nameInput.value = "";
        amountInput.value = "";
        categoryInput.value = "🍔 Food";
    }
});