(function () {
    const initialPlayersEl = document.getElementById('initialPlayersData');
    let currentPlayers = [];
    try {
        currentPlayers = JSON.parse((initialPlayersEl && initialPlayersEl.textContent) || '[]');
    } catch (e) {
        currentPlayers = [];
    }

    const PLACEHOLDER_CONTRACT_VALUE = '$10.0M';
    let activeFilter = 'all';
    let selectedPlayerId = currentPlayers.length > 0 ? currentPlayers[0].id : null;
    const shortlist = new Map();

    const searchForm = document.getElementById('playerSearchForm');
    const searchInput = document.getElementById('playerSearchInput');
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    const searchSubmitBtn = document.getElementById('searchSubmitBtn');
    const searchBtnText = document.getElementById('searchBtnText');
    const searchSpinner = document.getElementById('searchSpinner');
    const errorBanner = document.getElementById('searchErrorBanner');
    const resultsSection = document.getElementById('scoutingResultsSection');
    const spotlightCard = document.getElementById('playerSpotlightCard');
    const bentoGrid = document.getElementById('playersBentoGrid');
    const resultsCountBadge = document.getElementById('resultsCountBadge');
    const emptyResultsCard = document.getElementById('emptyResultsCard');
    const emptyQueryText = document.getElementById('emptyQueryText');
    const filterButtons = document.querySelectorAll('#positionFilters .filter-pill');
    const quickChips = document.querySelectorAll('.quick-chip');

    const shortlistTray = document.getElementById('shortlistTray');
    const shortlistCounterBadge = document.getElementById('shortlistCounterBadge');
    const shortlistCountText = document.getElementById('shortlistCountText');
    const shortlistSubCount = document.getElementById('shortlistSubCount');

    function escapeHtml(value) {
        if (value === null || value === undefined) return '';
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function getPositionMeta(position) {
        const pos = (position || 'Unknown').trim();
        const lower = pos.toLowerCase();
        if (lower.includes('attack') || lower.includes('forward') || lower.includes('striker')) {
            return { label: pos, code: 'ATT', theme: 'pos-attacker', accent: '#ff453a' };
        }
        if (lower.includes('midfield')) {
            return { label: pos, code: 'MID', theme: 'pos-midfielder', accent: '#30d158' };
        }
        if (lower.includes('defend') || lower.includes('back')) {
            return { label: pos, code: 'DEF', theme: 'pos-defender', accent: '#2997ff' };
        }
        if (lower.includes('goal') || lower.includes('keeper')) {
            return { label: pos, code: 'GK', theme: 'pos-goalkeeper', accent: '#ffd60a' };
        }
        return { label: pos || 'Unassigned', code: 'PRO', theme: 'pos-default', accent: '#bf5af2' };
    }

    function getInitials(player) {
        const first = (player.firstname || '').trim();
        const last = (player.lastname || '').trim();
        if (first && last) return (first[0] + last[0]).toUpperCase();
        const name = (player.name || 'P').trim();
        return name.slice(0, 2).toUpperCase();
    }

    function getFullName(player) {
        const parts = [player.firstname, player.lastname].filter(Boolean).join(' ').trim();
        return parts || player.name || 'Unknown Player';
    }

    function renderSpotlight(player) {
        if (!player) {
            spotlightCard.innerHTML = '';
            return;
        }
        const posMeta = getPositionMeta(player.position);
        const fullName = getFullName(player);
        const displayName = player.name || fullName;
        const isPinned = shortlist.has(player.id);
        const ageDisplay = player.age ? `${player.age} yrs` : 'N/A';
        const natDisplay = player.nationality || 'International';

        spotlightCard.className = `spotlight-dossier-card ${posMeta.theme}`;
        spotlightCard.innerHTML = `
            <div class="spotlight-ambient-orb"></div>
            <div class="spotlight-inner">
                <div class="spotlight-avatar-col">
                    <div class="spotlight-avatar-ring ${posMeta.theme}">
                        ${player.photo
                            ? `<img src="${escapeHtml(player.photo)}" alt="${escapeHtml(displayName)}" class="spotlight-photo" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                               <div class="spotlight-avatar-fallback" style="display:none;">${escapeHtml(getInitials(player))}</div>`
                            : `<div class="spotlight-avatar-fallback">${escapeHtml(getInitials(player))}</div>`
                        }
                        <span class="spotlight-pos-code ${posMeta.theme}">${escapeHtml(posMeta.code)}</span>
                    </div>
                </div>

                <div class="spotlight-info-col">
                    <div class="spotlight-top-meta">
                        <span class="spotlight-dossier-tag">ACTIVE SCOUTING DOSSIER</span>
                        <span class="spotlight-id-pill">Contract: ${escapeHtml(PLACEHOLDER_CONTRACT_VALUE)}</span>
                    </div>

                    <h2 class="spotlight-player-name">${escapeHtml(displayName)}</h2>
                    <p class="spotlight-legal-name">Full Registry Name: <strong>${escapeHtml(fullName)}</strong></p>

                    <div class="spotlight-metrics-grid">
                        <div class="spotlight-metric-box">
                            <span class="metric-label">Tactical Role</span>
                            <span class="metric-value ${posMeta.theme}-text">${escapeHtml(posMeta.label)}</span>
                        </div>
                        <div class="spotlight-metric-box">
                            <span class="metric-label">Nationality</span>
                            <span class="metric-value">${escapeHtml(natDisplay)}</span>
                        </div>
                        <div class="spotlight-metric-box">
                            <span class="metric-label">Player Age</span>
                            <span class="metric-value">${escapeHtml(ageDisplay)}</span>
                        </div>
                    </div>
                </div>

                <div class="spotlight-action-col">
                    <button type="button" class="btn-callup-spotlight ${isPinned ? 'is-pinned' : ''}" data-callup-id="${escapeHtml(player.id)}">
                        ${isPinned ? '✓ Pinned to Call-Ups' : '+ Call Up to League'}
                    </button>
                    <span class="spotlight-hint">Click any card below to switch dossier</span>
                </div>
            </div>
        `;

        const btn = spotlightCard.querySelector('[data-callup-id]');
        if (btn) {
            btn.addEventListener('click', () => toggleShortlist(player));
        }
    }

    function renderGrid() {
        const filtered = currentPlayers.filter(p => {
            if (activeFilter === 'all') return true;
            return (p.position || '').toLowerCase() === activeFilter.toLowerCase();
        });

        resultsCountBadge.textContent = `${filtered.length} ${filtered.length === 1 ? 'Profile' : 'Profiles'}`;

        if (filtered.length === 0) {
            bentoGrid.innerHTML = `
                <div class="bento-card text-center" style="grid-column: 1 / -1; padding: 2.5rem;">
                    <h3>No ${escapeHtml(activeFilter)}s in this search</h3>
                    <p style="margin-top: 0.4rem;">Switch the position filter above to view all ${currentPlayers.length} scouted profiles.</p>
                </div>
            `;
            return;
        }

        // Ensure selectedPlayerId is valid
        const activePlayer = filtered.find(p => p.id === selectedPlayerId) || filtered[0];
        selectedPlayerId = activePlayer ? activePlayer.id : null;
        renderSpotlight(activePlayer);

        bentoGrid.innerHTML = filtered.map(player => {
            const posMeta = getPositionMeta(player.position);
            const fullName = getFullName(player);
            const displayName = player.name || fullName;
            const isSelected = player.id === selectedPlayerId;
            const isPinned = shortlist.has(player.id);

            return `
                <article class="player-bento-card ${posMeta.theme} ${isSelected ? 'is-selected' : ''}" data-player-id="${escapeHtml(player.id)}">
                    <div class="player-card-glow"></div>

                    <div class="player-card-top">
                        <span class="pos-badge ${posMeta.theme}">
                            <span class="pos-dot"></span>
                            ${escapeHtml(posMeta.label)}
                        </span>
                        <button type="button" class="card-pin-btn ${isPinned ? 'is-pinned' : ''}" data-pin-id="${escapeHtml(player.id)}" title="${isPinned ? 'Remove from Call-Ups' : 'Add to Call-Ups'}">
                            ${isPinned ? '✓' : '+'}
                        </button>
                    </div>

                    <div class="player-card-identity">
                        <div class="player-avatar-wrap ${posMeta.theme}">
                            ${player.photo
                                ? `<img src="${escapeHtml(player.photo)}" alt="${escapeHtml(displayName)}" class="player-avatar-img" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                                   <div class="player-avatar-initials" style="display:none;">${escapeHtml(getInitials(player))}</div>`
                                : `<div class="player-avatar-initials">${escapeHtml(getInitials(player))}</div>`
                            }
                        </div>
                        <div class="player-name-block">
                            <h4 class="player-card-name">${escapeHtml(displayName)}</h4>
                            <p class="player-card-fullname">${escapeHtml(fullName)}</p>
                        </div>
                    </div>

                    <div class="player-micro-bento">
                        <div class="micro-stat">
                            <span class="micro-label">NATION</span>
                            <span class="micro-val" title="${escapeHtml(player.nationality || 'N/A')}">${escapeHtml(player.nationality || '—')}</span>
                        </div>
                        <div class="micro-stat">
                            <span class="micro-label">AGE</span>
                            <span class="micro-val">${player.age ? escapeHtml(player.age) : '—'}</span>
                        </div>
                        <div class="micro-stat">
                            <span class="micro-label">CONTRACT</span>
                            <span class="micro-val">${escapeHtml(PLACEHOLDER_CONTRACT_VALUE)}</span>
                        </div>
                    </div>
                </article>
            `;
        }).join('');

        // Attach card listeners
        bentoGrid.querySelectorAll('.player-bento-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.closest('[data-pin-id]')) return;
                const id = Number(card.getAttribute('data-player-id'));
                const found = currentPlayers.find(p => p.id === id);
                if (found) {
                    selectedPlayerId = found.id;
                    bentoGrid.querySelectorAll('.player-bento-card').forEach(c => c.classList.remove('is-selected'));
                    card.classList.add('is-selected');
                    renderSpotlight(found);
                    spotlightCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            });
        });

        bentoGrid.querySelectorAll('[data-pin-id]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = Number(btn.getAttribute('data-pin-id'));
                const found = currentPlayers.find(p => p.id === id);
                if (found) toggleShortlist(found);
            });
        });
    }

    function toggleShortlist(player) {
        if (!player || !player.id) return;
        if (shortlist.has(player.id)) {
            shortlist.delete(player.id);
        } else {
            shortlist.set(player.id, player);
        }
        renderShortlistTray();
        renderGrid();
    }

    function renderShortlistTray() {
        const count = shortlist.size;
        shortlistSubCount.textContent = `${count} ${count === 1 ? 'Player' : 'Players'} Pinned`;
        if (count > 0) {
            shortlistCounterBadge.style.display = 'inline-flex';
            shortlistCountText.textContent = `${count} Call-${count === 1 ? 'Up' : 'Ups'}`;
        } else {
            shortlistCounterBadge.style.display = 'none';
        }

        if (count === 0) {
            shortlistTray.innerHTML = `
                <div class="shortlist-empty">
                    Search and click <strong>+ Call Up</strong> on any player profile to pin them here.
                </div>
            `;
            return;
        }

        shortlistTray.innerHTML = Array.from(shortlist.values()).map(p => `
            <div class="shortlist-chip">
                ${p.photo ? `<img src="${escapeHtml(p.photo)}" alt="${escapeHtml(p.name)}" class="shortlist-chip-img">` : ''}
                <span class="shortlist-chip-name">${escapeHtml(p.name || getFullName(p))}</span>
                <button type="button" class="shortlist-chip-remove" data-remove-id="${escapeHtml(p.id)}" title="Remove">&times;</button>
            </div>
        `).join('');

        shortlistTray.querySelectorAll('[data-remove-id]').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = Number(btn.getAttribute('data-remove-id'));
                shortlist.delete(id);
                renderShortlistTray();
                renderGrid();
            });
        });
    }

    async function executePlayerSearch(query) {
        const trimmed = (query || '').trim();
        errorBanner.style.display = 'none';

        if (trimmed.length < 3) {
            errorBanner.textContent = 'API-Football requires at least 3 characters to search.';
            errorBanner.style.display = 'block';
            return;
        }

        searchSubmitBtn.disabled = true;
        searchBtnText.textContent = 'Scouting...';
        searchSpinner.style.display = 'inline-block';

        try {
            const response = await fetch(`/api/players/search?q=${encodeURIComponent(trimmed)}`, {
                headers: { 'Accept': 'application/json' }
            });
            const data = await response.json();

            if (!response.ok || data.error) {
                throw new Error(data.error || 'Unable to fetch player profiles.');
            }

            currentPlayers = Array.isArray(data.players) ? data.players : [];
            activeFilter = 'all';
            filterButtons.forEach(b => b.classList.toggle('active', b.getAttribute('data-pos') === 'all'));

            // Update URL cleanly without reloading
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.set('q', trimmed);
            window.history.replaceState({}, '', newUrl);

            if (currentPlayers.length === 0) {
                resultsSection.style.display = 'none';
                emptyQueryText.textContent = trimmed;
                emptyResultsCard.style.display = 'flex';
            } else {
                emptyResultsCard.style.display = 'none';
                resultsSection.style.display = 'block';
                selectedPlayerId = currentPlayers[0].id;
                renderGrid();
            }
        } catch (err) {
            errorBanner.textContent = err.message || 'An unexpected error occurred while searching.';
            errorBanner.style.display = 'block';
        } finally {
            searchSubmitBtn.disabled = false;
            searchBtnText.textContent = 'Scout Player';
            searchSpinner.style.display = 'none';
        }
    }

    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        executePlayerSearch(searchInput.value);
    });

    searchInput.addEventListener('input', () => {
        clearSearchBtn.style.display = searchInput.value.trim().length > 0 ? 'inline-flex' : 'none';
    });

    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        clearSearchBtn.style.display = 'none';
        errorBanner.style.display = 'none';
        searchInput.focus();
    });

    quickChips.forEach(chip => {
        chip.addEventListener('click', () => {
            const q = chip.getAttribute('data-query');
            searchInput.value = q;
            clearSearchBtn.style.display = 'inline-flex';
            executePlayerSearch(q);
        });
    });

    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            activeFilter = btn.getAttribute('data-pos');
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderGrid();
        });
    });

    // Initial render if server passed players
    if (currentPlayers.length > 0) {
        resultsSection.style.display = 'block';
        renderGrid();
    }
})();
