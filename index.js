// 1. IMPORT FIREBASE (Now with Auth!)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getDatabase, ref, push, onValue, remove, set } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

// 2. CONNECT TO YOUR SPECIFIC PROJECT
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

// 3. HTML ELEMENTS
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

// App State Variables
let editingItemID = null;
let currentUserID = null;     // Remembers who is logged in
let expensesInDB = null;      // Will point to THEIR specific folder
let budgetInDB = null;        // Will point to THEIR specific budget

// 4. AUTHENTICATION LOGIC
// Login Button Click
loginBtn.addEventListener("click", () => {
    signInWithPopup(auth, googleProvider).catch((error) => console.error("Login failed:", error));
});

// Logout Button Click
logoutBtn.addEventListener("click", () => {
    signOut(auth).catch((error) => console.error("Logout failed:", error));
});

// The "Security Guard": Constantly watches to see if someone logs in or out
onAuthStateChanged(auth, (user) => {
    if (user) {
        // --- USER IS LOGGED IN ---
        currentUserID = user.uid; // Grab their unique, scrambled Google ID

        // Hide login screen, show the app
        loginScreen.style.display = "none";
        appContainer.style.display = "block";
        welcomeText.textContent = `Welcome back, ${user.displayName.split(" ")[0]}!`;

        // RE-ROUTE THE DATABASE: Point to this specific user's private vault!
        expensesInDB = ref(database, `users/${currentUserID}/personal_expenses`);
        budgetInDB = ref(database, `users/${currentUserID}/budget`);

        // Now that we have their folder, start pulling their data
        loadUserData();

    } else {
        // --- USER IS LOGGED OUT ---
        currentUserID = null;
        expensesInDB = null;
        budgetInDB = null;

        // Show login screen, hide the app
        loginScreen.style.display = "flex";
        appContainer.style.display = "none";

        // Clear old data from the screen so the next person doesn't see it
        expenseList.innerHTML = "";
        totalDisplay.textContent = "₹0.00";
        budgetInput.value = "";
        progressFill.style.width = "0%";
    }
});

// 5. DATA LOGIC (Only runs when a user is logged in)
function loadUserData() {

    // Sync Budget Limit
    budgetInput.addEventListener("change", function () {
        set(budgetInDB, parseFloat(budgetInput.value) || 0);
    });

    onValue(budgetInDB, function (snapshot) {
        if (snapshot.exists()) {
            budgetInput.value = snapshot.val();
        }
    });

    // Render List & Progress Bar (Same exact logic as before!)
    onValue(expensesInDB, function (snapshot) {
        if (snapshot.exists()) {
            let itemsArray = Object.entries(snapshot.val());
            expenseList.innerHTML = "";
            let runningTotal = 0;

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

            let currentBudget = parseFloat(budgetInput.value) || 0;
            if (currentBudget > 0) {
                let percentage = (runningTotal / currentBudget) * 100;
                progressFill.style.width = `${Math.min(percentage, 100)}%`;
                if (percentage > 100) {
                    progressFill.classList.add("over-budget");
                } else {
                    progressFill.classList.remove("over-budget");
                }
            } else {
                progressFill.style.width = "0%";
            }

        } else {
            expenseList.innerHTML = "<li style='justify-content: center; color: #94a3b8; font-size: 14px;'>No items logged yet! ✨</li>";
            totalDisplay.textContent = "₹0.00";
            progressFill.style.width = "0%";
        }
    });
}

// 6. ADD OR UPDATE EXPENSE
addButton.addEventListener("click", function () {
    // Safety check: Don't allow saving if nobody is logged in
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