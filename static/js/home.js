document.addEventListener("DOMContentLoaded", function () {

    // Get the search input and clear button
    const searchInput = document.getElementById("playerSearchInput");
    const clearButton = document.getElementById("clearSearchBtn");

    // Clear the search when the X button is clicked
    clearButton.addEventListener("click", function () {

        searchInput.value = "";

        clearButton.style.display = "none";

        searchInput.focus();

    });

    // Show or hide the X button when typing
searchInput.addEventListener("input", function () {

    if (searchInput.value.length > 0) {
        clearButton.style.display = "inline-flex";
    } else {
        clearButton.style.display = "none";
    }

});


    // Get all Trending Call-Ups buttons
    const trendingButtons = document.querySelectorAll(".quick-chip");

    // Add a click event to each button
    trendingButtons.forEach(function (button) {

        button.addEventListener("click", function () {

           // Get the player's full name from the Trending Call-Ups button
const playerName = button.textContent.trim();

            // Put the player's name in the search input
            searchInput.value = playerName;

            // Show the X button
            clearButton.style.display = "inline-flex";

            // Focus on the search input
            searchInput.focus();

        });

    });

    // Get players sent by Flask
const playersData = document.getElementById("initialPlayersData");

// Convert JSON data into a JavaScript array
const players = JSON.parse(playersData.textContent);

// Display players in the browser console
console.log("Players received from Flask:", players);

// Get the container where player cards will appear
const playersGrid = document.getElementById("playersBentoGrid");

// Get saved players from localStorage
let shortlist = JSON.parse(localStorage.getItem("shortlist")) || [];

// Get shortlist HTML elements
const shortlistTray = document.getElementById("shortlistTray");
const shortlistSubCount = document.getElementById("shortlistSubCount");
const shortlistCounterBadge = document.getElementById("shortlistCounterBadge");
const shortlistCountText = document.getElementById("shortlistCountText");

// Save shortlist
function saveShortlist() {
    localStorage.setItem("shortlist", JSON.stringify(shortlist));
}

// Update shortlist counters
function updateShortlistCount() {

    const count = shortlist.length;

    shortlistSubCount.textContent =
        count + (count === 1 ? " Player Pinned" : " Players Pinned");

    shortlistCountText.textContent =
        count + (count === 1 ? " Call-Up" : " Call-Ups");

    shortlistCounterBadge.style.display =
        count > 0 ? "inline-flex" : "none";
}

// Display saved players in the shortlist
function displayShortlist() {

    shortlistTray.innerHTML = "";

    // Show an empty message if no players are selected
    if (shortlist.length === 0) {

        shortlistTray.innerHTML = `
            <div class="shortlist-empty">
                Search and click <strong>+ Call Up</strong>
                on any player profile to pin them here.
            </div>
        `;

    } else {

        shortlist.forEach(function (player) {

            const chip = document.createElement("div");
            chip.className = "shortlist-chip";

            // Player photo
            if (player.photo) {

                const image = document.createElement("img");
                image.className = "shortlist-chip-img";
                image.src = player.photo;
                image.alt = player.name || "Player";

                chip.appendChild(image);
            }

            // Player name
            const playerName = document.createElement("span");
            playerName.textContent = player.name || "Unknown Player";

            chip.appendChild(playerName);

            // Remove button
            const removeButton = document.createElement("button");
            removeButton.type = "button";
            removeButton.className = "shortlist-chip-remove";
            removeButton.textContent = "×";

            chip.appendChild(removeButton);

            // Remove player when clicking X
            removeButton.addEventListener("click", function () {

                shortlist = shortlist.filter(function (savedPlayer) {
                    return savedPlayer.id !== player.id;
                });

                saveShortlist();
                displayShortlist();

                // Update the + button if the player's card is visible
                const pinButton = document.querySelector(
                    `.card-pin-btn[data-player-id="${player.id}"]`
                );

                if (pinButton) {
                    pinButton.classList.remove("is-pinned");
                    pinButton.textContent = "+";
                }

                // Reset Spotlight button if the removed player is featured
if (players.length > 0 && player.id === players[0].id) {

    const spotlightButton = document.querySelector(".btn-callup-spotlight");

    if (spotlightButton) {
        spotlightButton.textContent = "+ Call Up";
    }

}

            });

            shortlistTray.appendChild(chip);

        });

    }

    updateShortlistCount();
}

// Display saved players when the page loads
displayShortlist();

// Get the Spotlight Player container
const spotlightCard = document.getElementById("playerSpotlightCard");

// Display the first player in the Spotlight
if (players.length > 0) {

    const player = players[0];

    const name = player.name || "Unknown Player";
    const age = player.age ?? "N/A";
    const nationality = player.nationality || "N/A";
    const position = player.position || "Unknown";

    const positionClass = "pos-" + position.toLowerCase();

    // Apply the position color
    spotlightCard.classList.add(positionClass);

    // Create the Spotlight structure
    spotlightCard.innerHTML = `
        <div class="spotlight-ambient-orb"></div>

        <div class="spotlight-inner">

            <div class="spotlight-avatar-col">
                <div class="spotlight-avatar-ring ${positionClass}">
                    <div class="spotlight-avatar-fallback">?</div>
                </div>
            </div>

            <div class="spotlight-info-col">

                <div class="spotlight-top-meta">
                    <span class="spotlight-dossier-tag">
                        FEATURED PLAYER
                    </span>
                </div>

                <h2 class="spotlight-player-name"></h2>

                <p class="spotlight-legal-name"></p>

                <div class="spotlight-metrics-grid">

                    <div class="spotlight-metric-box">
                        <span class="metric-label">Age</span>
                        <span class="metric-value" id="spotlightAge"></span>
                    </div>

                    <div class="spotlight-metric-box">
                        <span class="metric-label">Nationality</span>
                        <span class="metric-value" id="spotlightNationality"></span>
                    </div>

                    <div class="spotlight-metric-box">
                        <span class="metric-label">Position</span>
                        <span class="metric-value" id="spotlightPosition"></span>
                    </div>

                </div>

            </div>

            <div class="spotlight-action-col">
                <button type="button" class="btn-callup-spotlight">
                    + Call Up
                </button>
            </div>

        </div>
    `;

    // Insert player information
    spotlightCard.querySelector(".spotlight-player-name").textContent = name;

    spotlightCard.querySelector(".spotlight-legal-name").textContent =
        [player.firstname, player.lastname].filter(Boolean).join(" ");

    document.getElementById("spotlightAge").textContent = age;
    document.getElementById("spotlightNationality").textContent = nationality;
    document.getElementById("spotlightPosition").textContent = position;

    // Display player photo
    if (player.photo) {

        const avatarRing = spotlightCard.querySelector(".spotlight-avatar-ring");

        avatarRing.innerHTML = "";

        const image = document.createElement("img");
        image.className = "spotlight-photo";
        image.src = player.photo;
        image.alt = name;

        avatarRing.appendChild(image);
    }

    // Get the Spotlight Call Up button
const spotlightButton = spotlightCard.querySelector(".btn-callup-spotlight");

// Check if the featured player is already in the shortlist
const alreadyPinned = shortlist.some(function (savedPlayer) {
    return savedPlayer.id === player.id;
});

// Update the button if the player is already selected
if (alreadyPinned) {
    spotlightButton.textContent = "✓ Called Up";
}

// Add the featured player to the shortlist
spotlightButton.addEventListener("click", function () {

    // Check if the player is already selected
    const exists = shortlist.some(function (savedPlayer) {
        return savedPlayer.id === player.id;
    });

    if (exists) {
        return;
    }

    // Add player to the shortlist
    shortlist.push(player);

    // Save the shortlist
    saveShortlist();

    // Update the shortlist display
    displayShortlist();

    // Update the Spotlight button
    spotlightButton.textContent = "✓ Called Up";

    // Update the small player card button
    const pinButton = document.querySelector(
        `.card-pin-btn[data-player-id="${player.id}"]`
    );

    if (pinButton) {
        pinButton.classList.add("is-pinned");
        pinButton.textContent = "✓";
    }

   

  

});

}

/// Create a player card using the existing CSS design
players.forEach(function (player) {

    const card = document.createElement("div");

    // Get player information
    const name = player.name || "Unknown Player";
    const age = player.age ?? "N/A";
    const nationality = player.nationality || "N/A";
    const position = player.position || "Unknown";
    const photo = player.photo;

    // Choose the CSS class based on the player's position
    const positionClass = "pos-" + position.toLowerCase();

    // Apply the existing CSS classes
    card.className = "player-bento-card " + positionClass;

    // Create the card structure
    card.innerHTML = `
        <div class="player-card-glow"></div>

        <div class="player-card-top">

            <span class="pos-badge ${positionClass}">
                <span class="pos-dot"></span>
                ${position}
            </span>

            <button type="button" class="card-pin-btn" title="Add to shortlist">
                +
            </button>

        </div>

        <div class="player-card-identity">

            <div class="player-avatar-wrap ${positionClass}">
                ${photo
                    ? `<img class="player-avatar-img" alt="Player photo">`
                    : `<div class="player-avatar-initials">?</div>`
                }
            </div>

            <div class="player-name-block">
                <h3 class="player-card-name"></h3>
                <p class="player-card-fullname"></p>
            </div>

        </div>

        <div class="player-micro-bento">

            <div class="micro-stat">
                <span class="micro-label">AGE</span>
                <span class="micro-val"></span>
            </div>

            <div class="micro-stat">
                <span class="micro-label">NATIONALITY</span>
                <span class="micro-val"></span>
            </div>

            <div class="micro-stat">
                <span class="micro-label">POSITION</span>
                <span class="micro-val"></span>
            </div>

        </div>
    `;

    // Insert player information safely
    card.querySelector(".player-card-name").textContent = name;

    card.querySelector(".player-card-fullname").textContent =
        [player.firstname, player.lastname].filter(Boolean).join(" ");

    const stats = card.querySelectorAll(".micro-val");

    stats[0].textContent = age;
    stats[1].textContent = nationality;
    stats[2].textContent = position;

    // Add the player's photo
    if (photo) {
        card.querySelector(".player-avatar-img").src = photo;
    }

    // Add the card to the grid
    playersGrid.appendChild(card);

    // Get the + button
const pinButton = card.querySelector(".card-pin-btn");

// Store the player's ID on the button
pinButton.dataset.playerId = player.id;

// Check if the player is already saved
const alreadyPinned = shortlist.some(function (savedPlayer) {
    return savedPlayer.id === player.id;
});

if (alreadyPinned) {
    pinButton.classList.add("is-pinned");
    pinButton.textContent = "✓";
}

// Add player to shortlist
pinButton.addEventListener("click", function () {

    // Check if player is already selected
    const exists = shortlist.some(function (savedPlayer) {
        return savedPlayer.id === player.id;
    });

    if (exists) {
        return;
    }

    // Add player to the array
    shortlist.push(player);

    // Save in localStorage
    saveShortlist();

    // Update shortlist display
    displayShortlist();

   // Update button appearance
pinButton.classList.add("is-pinned");
pinButton.textContent = "✓";

// Update Spotlight button if it shows the same player
if (players.length > 0 && player.id === players[0].id) {

    const spotlightButton = document.querySelector(".btn-callup-spotlight");

    if (spotlightButton) {
        spotlightButton.textContent = "✓ Called Up";
    }

}
});

    
});

// Get all position filter buttons
const filterButtons = document.querySelectorAll(".filter-pill");



// Add a click event to each filter
filterButtons.forEach(function (button) {

    button.addEventListener("click", function () {

        // Get the selected position
        const selectedPosition = button.getAttribute("data-pos");

        // Remove active class from all buttons
        filterButtons.forEach(function (btn) {
            btn.classList.remove("active");
        });

        // Highlight the selected button
        button.classList.add("active");

        // Get all player cards
        const playerCards = document.querySelectorAll(".player-bento-card");

        // Show only players matching the selected position
        playerCards.forEach(function (card) {

            const cardPosition = card.querySelector(".pos-badge").textContent.trim();

            if (selectedPosition === "all" || cardPosition === selectedPosition) {
                card.style.display = "flex";
            } else {
                card.style.display = "none";
            }

        });

    });

});



});