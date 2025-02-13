// DOM Elements
const ingredientInput = document.getElementById('ingredientInput');
const addIngredientBtn = document.getElementById('addIngredient');
const ingredientList = document.getElementById('ingredientList');
const canShopCheckbox = document.getElementById('canShop');
const recipeCards = document.getElementById('recipeCards');
const rejectBtn = document.getElementById('rejectBtn');
const acceptBtn = document.getElementById('acceptBtn');
const noMoreRecipes = document.getElementById('noMoreRecipes');
const resetBtn = document.getElementById('resetBtn');

// State
let ingredients = [];
let currentRecipes = [];
let currentRecipeIndex = 0;

// Show current recipe with image
function showCurrentRecipe() {
    recipeCards.innerHTML = '';
    
    if (currentRecipeIndex >= currentRecipes.length) {
        noMoreRecipes.classList.remove('hidden');
        return;
    }
    
    noMoreRecipes.classList.add('hidden');
    const recipe = currentRecipes[currentRecipeIndex];
    
    const card = document.createElement('div');
    card.className = 'recipe-card';
    card.innerHTML = `
        <div class="recipe-image-container">
            <img src="${recipe.imageUrl}" alt="${recipe.name}" class="recipe-image">
            <div class="recipe-title-overlay">
                <h2>${recipe.name}</h2>
            </div>
        </div>
        <div class="recipe-content">
            <p><strong>Cuisine:</strong> ${recipe.cuisine}</p>
            <p>${recipe.description}</p>
            <p><strong>Required Ingredients:</strong></p>
            <p>${recipe.ingredients.join(', ')}</p>
            <p><strong>Instructions:</strong></p>
            <p>${recipe.instructions}</p>
        </div>
    `;
    
    recipeCards.appendChild(card);
    initializeSwipe(card);
}

// Updated function to get recipe suggestions using API
async function getRecipeSuggestions() {
    try {
        const response = await fetch('/.netlify/functions/getRecipes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ingredients: ingredients,
                canShop: canShopCheckbox.checked
            })
        });

        if (!response.ok) {
            throw new Error(`API call failed: ${response.status}`);
        }

        const data = await response.json();
        return data.recipes;

    } catch (error) {
        console.error('Error fetching recipes:', error);
        return sampleRecipes; // Fallback to sample recipes if API fails
    }
}
/*
// Sample recipes (replace this with API call in production)
const sampleRecipes = [
    {
        name: "Pasta Carbonara",
        cuisine: "Italian",
        ingredients: ["pasta", "eggs", "bacon", "parmesan"],
        description: "A classic Italian pasta dish with eggs, cheese, and bacon."
    },
    {
        name: "Chicken Stir Fry",
        cuisine: "Asian",
        ingredients: ["chicken", "vegetables", "soy sauce"],
        description: "Quick and easy Asian stir fry with chicken and mixed vegetables."
    }
    // Add more sample recipes here
];
*/

// Add ingredient
function addIngredient() {
    const ingredient = ingredientInput.value.trim().toLowerCase();
    if (ingredient && !ingredients.includes(ingredient)) {
        ingredients.push(ingredient);
        const li = document.createElement('li');
        li.innerHTML = `
            ${ingredient}
            <button class="delete-ingredient" data-ingredient="${ingredient}">✕</button>
        `;
        ingredientList.appendChild(li);
        ingredientInput.value = '';
        updateRecipes();
    }
}

// Remove ingredient
ingredientList.addEventListener('click', (e) => {
    if (e.target.classList.contains('delete-ingredient')) {
        const ingredient = e.target.dataset.ingredient;
        ingredients = ingredients.filter(ing => ing !== ingredient);
        e.target.parentElement.remove();
        updateRecipes();
    }
});

// Event listeners
addIngredientBtn.addEventListener('click', addIngredient);
ingredientInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addIngredient();
});

canShopCheckbox.addEventListener('change', updateRecipes);

// Update recipes based on ingredients
function updateRecipes() {
    // In production, this would make an API call to Claude
    currentRecipes = sampleRecipes.filter(recipe => {
        if (canShopCheckbox.checked) return true;
        return recipe.ingredients.some(ing => ingredients.includes(ing));
    });
    currentRecipeIndex = 0;
    showCurrentRecipe();
}

// Show current recipe
function showCurrentRecipe() {
    recipeCards.innerHTML = '';
    
    if (currentRecipeIndex >= currentRecipes.length) {
        noMoreRecipes.classList.remove('hidden');
        return;
    }
    
    noMoreRecipes.classList.add('hidden');
    const recipe = currentRecipes[currentRecipeIndex];
    
    const card = document.createElement('div');
    card.className = 'recipe-card';
    card.innerHTML = `
        <h2>${recipe.name}</h2>
        <p><strong>Cuisine:</strong> ${recipe.cuisine}</p>
        <p>${recipe.description}</p>
        <p><strong>Required Ingredients:</strong></p>
        <p>${recipe.ingredients.join(', ')}</p>
    `;
    
    recipeCards.appendChild(card);
    initializeSwipe(card);
}

// Swipe functionality
function initializeSwipe(element) {
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let translateX = 0;
    let translateY = 0;

    element.addEventListener('mousedown', startDragging);
    element.addEventListener('touchstart', startDragging);
    document.addEventListener('mousemove', drag);
    document.addEventListener('touchmove', drag);
    document.addEventListener('mouseup', stopDragging);
    document.addEventListener('touchend', stopDragging);

    function startDragging(e) {
        isDragging = true;
        element.classList.add('swiping');
        startX = e.type === 'mousedown' ? e.clientX : e.touches[0].clientX;
        startY = e.type === 'mousedown' ? e.clientY : e.touches[0].clientY;
    }

    function drag(e) {
        if (!isDragging) return;
        
        e.preventDefault();
        const currentX = e.type === 'mousemove' ? e.clientX : e.touches[0].clientX;
        const currentY = e.type === 'mousemove' ? e.clientY : e.touches[0].clientY;
        
        translateX = currentX - startX;
        translateY = currentY - startY;
        
        element.style.transform = `translate(${translateX}px, ${translateY}px) rotate(${translateX * 0.1}deg)`;
    }

    function stopDragging() {
        if (!isDragging) return;
        
        isDragging = false;
        element.classList.remove('swiping');
        
        if (Math.abs(translateX) > 100) {
            // Swipe threshold met
            const direction = translateX > 0 ? 'right' : 'left';
            completeSwipe(direction);
        } else {
            // Reset position
            element.style.transform = '';
        }
    }
}

// Handle swipe completion
function completeSwipe(direction) {
    const card = document.querySelector('.recipe-card');
    const swipeAnimation = card.animate([
        { transform: card.style.transform },
        { transform: `translate(${direction === 'right' ? 1000 : -1000}px, ${translateY}px) rotate(${direction === 'right' ? 30 : -30}deg)` }
    ], {
        duration: 300,
        easing: 'ease-out'
    });

    swipeAnimation.onfinish = () => {
        currentRecipeIndex++;
        showCurrentRecipe();
    };
}

// Button controls
rejectBtn.addEventListener('click', () => completeSwipe('left'));
acceptBtn.addEventListener('click', () => completeSwipe('right'));
resetBtn.addEventListener('click', () => {
    currentRecipeIndex = 0;
    showCurrentRecipe();
});

// Initialize
updateRecipes();
