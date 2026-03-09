// js/vehicles.js
let filteredVehicles = [];

document.addEventListener('DOMContentLoaded', async () => {
    console.log("🚗 Vehicles page loaded");
    
    // Initialize AOS
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 800,
            once: true
        });
    }

    // Initialize mobile menu
    initMobileMenu();

    // Load vehicles
    await loadVehicles();
    
    // Initialize filters
    initFilters();
    initLiveSearch();
    initSort();
    
    // Check URL for type parameter
    const urlParams = new URLSearchParams(window.location.search);
    const typeParam = urlParams.get('type');
    if (typeParam) {
        const titleEl = document.getElementById('page-title');
        const subtitleEl = document.getElementById('page-subtitle');
        if (titleEl) titleEl.textContent = typeParam === 'Car' ? 'Browse Cars' : 'Browse Bikes';
        if (subtitleEl) subtitleEl.textContent = `Find your perfect ${typeParam === 'Car' ? 'car' : 'bike'} from our collection`;
        
        const tab = document.querySelector(`.filter-tab[data-filter="${typeParam}"]`);
        if (tab) tab.click();
    }
});

// Mobile menu initialization
function initMobileMenu() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', function() {
            this.classList.toggle('active');
            navMenu.classList.toggle('active');
            document.body.classList.toggle('menu-open');
        });
        
        document.querySelectorAll('.nav-menu a').forEach(link => {
            link.addEventListener('click', function() {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
                document.body.classList.remove('menu-open');
            });
        });
    }
}

async function loadVehicles() {
    const grid = document.getElementById('vehicles-grid');
    const spinner = document.getElementById('loading-spinner');
    const noResults = document.getElementById('no-results');
    
    if (!grid) {
        console.error("Vehicles grid not found!");
        return;
    }
    
    // Show spinner
    if (spinner) spinner.style.display = 'block';
    if (grid) grid.style.display = 'none';
    if (noResults) noResults.style.display = 'none';
    
    try {
        console.log("📡 Fetching vehicles from Google Sheets...");
        
        // Check if fetchVehiclesFromSheet exists
        if (typeof fetchVehiclesFromSheet !== 'function') {
            console.error("fetchVehiclesFromSheet function not found!");
            throw new Error("Data function missing");
        }
        
        // Fetch vehicles
        const vehicles = await fetchVehiclesFromSheet();
        
        console.log(`✅ Loaded ${vehicles.length} vehicles`);
        
        if (vehicles.length > 0) {
            filteredVehicles = [...vehicles];
            renderVehicles(filteredVehicles);
            updateResultsCount(filteredVehicles.length);
        } else {
            if (grid) {
                grid.innerHTML = '<p class="no-vehicles">No vehicles available</p>';
                grid.style.display = 'block';
            }
        }
        
        if (spinner) spinner.style.display = 'none';
        
    } catch (error) {
        console.error('❌ Error loading vehicles:', error);
        if (spinner) spinner.style.display = 'none';
        if (grid) {
            grid.innerHTML = '<div class="error">Error loading vehicles. Please try again.</div>';
            grid.style.display = 'block';
        }
    }
}

function renderVehicles(vehicles) {
    const grid = document.getElementById('vehicles-grid');
    const noResults = document.getElementById('no-results');
    
    if (!grid) return;

    if (vehicles.length === 0) {
        if (grid) grid.style.display = 'none';
        if (noResults) noResults.style.display = 'block';
        return;
    }

    if (grid) grid.style.display = 'grid';
    if (noResults) noResults.style.display = 'none';
    
    grid.innerHTML = vehicles.map(vehicle => `
        <div class="vehicle-card" onclick="openVehicleModal(${vehicle.id})">
            <div class="vehicle-image">
                <img src="${vehicle.image || 'https://placehold.co/600x400/0A1929/FFFFFF?text=No+Image'}" 
                     alt="${vehicle.name}" 
                     loading="lazy"
                     onerror="this.src='https://placehold.co/600x400/0A1929/FFFFFF?text=Image+Error'">
                <span class="vehicle-badge ${(vehicle.status || 'available').toLowerCase()}">${vehicle.status || 'AVAILABLE'}</span>
            </div>
            <div class="vehicle-info">
                <h3 class="vehicle-name">${vehicle.name}</h3>
                <p class="vehicle-year">${vehicle.year}</p>
                <p class="vehicle-price">${formatPrice(vehicle.price)}</p>
            </div>
        </div>
    `).join('');
}

function initFilters() {
    const tabs = document.querySelectorAll('.filter-tab');
    if (!tabs.length) {
        console.log("No filter tabs found");
        return;
    }
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            const filterType = tab.dataset.filter;
            
            if (filterType === 'all') {
                filteredVehicles = [...window.allVehicles];
            } else {
                filteredVehicles = window.allVehicles.filter(v => 
                    v.type && v.type.toLowerCase() === filterType.toLowerCase()
                );
            }
            
            applySearchAndSort();
        });
    });
}

function initLiveSearch() {
    const searchInput = document.getElementById('live-search');
    const clearBtn = document.getElementById('clear-search');
    
    if (!searchInput || !clearBtn) return;
    
    searchInput.addEventListener('input', (e) => {
        clearBtn.style.display = e.target.value.length > 0 ? 'block' : 'none';
        applySearchAndSort();
    });
    
    clearBtn.addEventListener('click', () => {
        searchInput.value = '';
        clearBtn.style.display = 'none';
        applySearchAndSort();
    });
}

function initSort() {
    const sortSelect = document.getElementById('sort-price');
    if (sortSelect) {
        sortSelect.addEventListener('change', applySearchAndSort);
    }
}

function applySearchAndSort() {
    let vehicles = [...window.allVehicles];
    
    // Apply type filter
    const activeTab = document.querySelector('.filter-tab.active');
    if (activeTab) {
        const filterType = activeTab.dataset.filter;
        if (filterType !== 'all') {
            vehicles = vehicles.filter(v => 
                v.type && v.type.toLowerCase() === filterType.toLowerCase()
            );
        }
    }
    
    // Apply search
    const searchTerm = document.getElementById('live-search')?.value.toLowerCase();
    if (searchTerm) {
        vehicles = vehicles.filter(v => 
            (v.name && v.name.toLowerCase().includes(searchTerm)) ||
            (v.year && v.year.toString().includes(searchTerm))
        );
    }
    
    // Apply sort
    const sortBy = document.getElementById('sort-price')?.value;
    if (sortBy === 'low-high') {
        vehicles.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'high-low') {
        vehicles.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'newest') {
        vehicles.sort((a, b) => b.year - a.year);
    } else if (sortBy === 'oldest') {
        vehicles.sort((a, b) => a.year - b.year);
    }
    
    filteredVehicles = vehicles;
    renderVehicles(vehicles);
    updateResultsCount(vehicles.length);
}

function updateResultsCount(count) {
    const countSpan = document.querySelector('.results-count span');
    if (countSpan) {
        countSpan.textContent = count;
    }
}

function resetAllFilters() {
    const searchInput = document.getElementById('live-search');
    const clearBtn = document.getElementById('clear-search');
    const sortSelect = document.getElementById('sort-price');
    
    if (searchInput) searchInput.value = '';
    if (clearBtn) clearBtn.style.display = 'none';
    if (sortSelect) sortSelect.value = 'default';
    
    const allTab = document.querySelector('.filter-tab[data-filter="all"]');
    if (allTab) {
        document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
        allTab.classList.add('active');
    }
    
    filteredVehicles = [...window.allVehicles];
    renderVehicles(filteredVehicles);
    updateResultsCount(filteredVehicles.length);
}

// Make functions globally available
window.resetAllFilters = resetAllFilters;
