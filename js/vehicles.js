// js/vehicles.js
let allVehicles = [];
let filteredVehicles = [];

document.addEventListener('DOMContentLoaded', async () => {
    console.log("Vehicles page loaded");
    
    // Initialize AOS
    AOS.init({
        duration: 800,
        once: true
    });

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
        document.getElementById('page-title').textContent = typeParam === 'Car' ? 'Browse Cars' : 'Browse Bikes';
        document.getElementById('page-subtitle').textContent = `Find your perfect ${typeParam === 'Car' ? 'car' : 'bike'} from our collection`;
        
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
        
        // Close menu when clicking a link
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
    
    if (!grid) return;
    
    spinner.style.display = 'block';
    grid.style.display = 'none';
    noResults.style.display = 'none';
    
    try {
        console.log("Fetching vehicles from Google Sheets...");
        allVehicles = await fetchVehiclesFromSheet();
        console.log(`Loaded ${allVehicles.length} vehicles`);
        
        filteredVehicles = [...allVehicles];
        
        setTimeout(() => {
            spinner.style.display = 'none';
            if (allVehicles.length > 0) {
                renderVehicles(filteredVehicles);
                updateResultsCount(filteredVehicles.length);
            } else {
                grid.innerHTML = '<p class="no-vehicles">No vehicles available</p>';
                grid.style.display = 'block';
            }
        }, 500);
    } catch (error) {
        console.error('Error loading vehicles:', error);
        spinner.style.display = 'none';
        grid.innerHTML = '<div class="error">Error loading vehicles. Please try again.</div>';
        grid.style.display = 'block';
    }
}

function renderVehicles(vehicles) {
    const grid = document.getElementById('vehicles-grid');
    const noResults = document.getElementById('no-results');
    
    if (!grid) return;

    if (vehicles.length === 0) {
        grid.style.display = 'none';
        noResults.style.display = 'block';
        return;
    }

    grid.style.display = 'grid';
    noResults.style.display = 'none';
    
    grid.innerHTML = vehicles.map(vehicle => `
        <div class="vehicle-card" onclick="openVehicleModal(${vehicle.id})">
            <div class="vehicle-image">
                <img src="${vehicle.image}" alt="${vehicle.name}" loading="lazy">
                <span class="vehicle-badge ${vehicle.status.toLowerCase()}">${vehicle.status}</span>
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
    if (!tabs.length) return;
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs
            tabs.forEach(t => t.classList.remove('active'));
            // Add active class to clicked tab
            tab.classList.add('active');
            
            const filterType = tab.dataset.filter;
            
            if (filterType === 'all') {
                filteredVehicles = [...allVehicles];
            } else {
                filteredVehicles = allVehicles.filter(v => 
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
        if (e.target.value.length > 0) {
            clearBtn.style.display = 'block';
        } else {
            clearBtn.style.display = 'none';
        }
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
    let vehicles = [...allVehicles];
    
    // Get active filter tab
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
            (v.year && v.year.toString().includes(searchTerm)) ||
            (v.type && v.type.toLowerCase().includes(searchTerm))
        );
    }
    
    // Apply sort
    const sortBy = document.getElementById('sort-price')?.value;
    if (sortBy === 'low-high') {
        vehicles.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sortBy === 'high-low') {
        vehicles.sort((a, b) => (b.price || 0) - (a.price || 0));
    } else if (sortBy === 'newest') {
        vehicles.sort((a, b) => (b.year || 0) - (a.year || 0));
    } else if (sortBy === 'oldest') {
        vehicles.sort((a, b) => (a.year || 0) - (b.year || 0));
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
    
    // Reset active tab
    const allTab = document.querySelector('.filter-tab[data-filter="all"]');
    if (allTab) {
        document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
        allTab.classList.add('active');
    }
    
    filteredVehicles = [...allVehicles];
    renderVehicles(filteredVehicles);
    updateResultsCount(filteredVehicles.length);
}

// Modal functions
window.openVehicleModal = function(vehicleId) {
    const vehicle = allVehicles.find(v => v.id === vehicleId);
    if (!vehicle) {
        console.error("Vehicle not found:", vehicleId);
        return;
    }
    
    const modal = document.getElementById('vehicle-modal');
    const modalBody = document.getElementById('modal-body');
    const modalTitle = document.getElementById('modal-title');
    
    if (!modal || !modalBody || !modalTitle) return;
    
    modalTitle.textContent = vehicle.name;
    
    // Generate images HTML
    let imagesHtml = '';
    if (vehicle.images && vehicle.images.length > 0) {
        imagesHtml = `
            <div class="modal-vehicle-gallery">
                <div class="modal-main-image">
                    <img src="${vehicle.images[0]}" alt="${vehicle.name}" id="modal-main-img">
                </div>
                <div class="modal-thumbnails">
                    ${vehicle.images.map((img, index) => `
                        <img src="${img}" alt="Thumbnail ${index + 1}" 
                             class="modal-thumbnail ${index === 0 ? 'active' : ''}"
                             onclick="changeModalImage('${img}', this)">
                    `).join('')}
                </div>
            </div>
        `;
    } else {
        imagesHtml = `
            <div class="modal-vehicle-gallery">
                <div class="modal-main-image">
                    <img src="${vehicle.image}" alt="${vehicle.name}">
                </div>
            </div>
        `;
    }
    
    // YouTube button only if link exists
    const youtubeButton = vehicle.youtube && vehicle.youtube.trim() !== '' ? 
        `<a href="${vehicle.youtube}" target="_blank" class="btn-youtube">
            <i class="fab fa-youtube"></i> Watch Review on YouTube
        </a>` : '';
    
    modalBody.innerHTML = `
        ${imagesHtml}
        
        <div class="modal-vehicle-info">
            <h3>${vehicle.name}</h3>
            <div class="modal-vehicle-price">${formatPrice(vehicle.price)}</div>
            
            <div class="modal-vehicle-details">
                <div class="detail-item">
                    <i class="fas fa-calendar-alt"></i>
                    <span>Year: ${vehicle.year}</span>
                </div>
                <div class="detail-item">
                    <i class="fas fa-tag"></i>
                    <span>Type: ${vehicle.type}</span>
                </div>
                <div class="detail-item">
                    <i class="fas fa-check-circle" style="color: ${vehicle.status === 'Available' ? '#4CAF50' : '#f44336'}"></i>
                    <span>Status: ${vehicle.status}</span>
                </div>
            </div>
            
            ${youtubeButton}
            
            <div class="modal-actions">
                <a href="https://wa.me/917674905538?text=Hi%20AutoMarket%2C%20I'm%20interested%20in%20${encodeURIComponent(vehicle.name)}%20(${vehicle.year})%20priced%20at%20${formatPrice(vehicle.price)}" 
                   target="_blank" 
                   class="btn-whatsapp">
                    <i class="fab fa-whatsapp"></i> Book Now
                </a>
                <button class="btn-share" onclick="shareVehicle(${vehicle.id})">
                    <i class="fas fa-share-alt"></i> Share
                </button>
            </div>
        </div>
    `;
    
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
};

// Function to change modal image
window.changeModalImage = function(src, element) {
    const mainImg = document.getElementById('modal-main-img');
    if (mainImg) {
        mainImg.src = src;
    }
    
    // Update active class
    document.querySelectorAll('.modal-thumbnail').forEach(t => {
        t.classList.remove('active');
    });
    element.classList.add('active');
};

// Share function
window.shareVehicle = function(vehicleId) {
    const vehicle = allVehicles.find(v => v.id === vehicleId);
    if (!vehicle) return;
    
    const shareText = `Check out this ${vehicle.name} (${vehicle.year}) priced at ${formatPrice(vehicle.price)}`;
    
    if (navigator.share) {
        navigator.share({
            title: vehicle.name,
            text: shareText,
            url: window.location.href
        }).catch(() => {
            // Fallback if share fails
            copyToClipboard(shareText);
        });
    } else {
        copyToClipboard(shareText);
    }
};

// Helper function to copy to clipboard
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert('Vehicle details copied to clipboard!');
    }).catch(() => {
        alert('Press Ctrl+C to copy: ' + text);
    });
}

// Modal close handlers
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('vehicle-modal');
    if (!modal) return;
    
    const closeBtn = modal.querySelector('.modal-close');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('show')) {
            closeModal();
        }
    });
});

function closeModal() {
    const modal = document.getElementById('vehicle-modal');
    modal.classList.remove('show');
    document.body.style.overflow = 'auto';
}

// Make functions globally available
window.resetAllFilters = resetAllFilters;

// Format price function
function formatPrice(price) {
    if (!price) return '₹0';
    return `₹${price.toLocaleString('en-IN')}`;
}
