// js/main.js
document.addEventListener('DOMContentLoaded', async () => {
    console.log("🏠 Homepage loaded");
    
    // Initialize AOS
    AOS.init({
        duration: 1000,
        once: true,
        offset: 100
    });
    
    // Initialize hero banner slider
    initHeroSlider();
    
    // Initialize mobile menu
    initMobileMenu();
    
    // Load vehicles FIRST
    console.log("Loading vehicles for homepage...");
    await fetchVehiclesFromSheet();
    
    // Then load featured vehicles
    loadFeaturedVehicles();
    
    // Load YouTube videos
    loadYouTubeVideos();
    
    // Set active nav link
    setActiveNavLink();
});

function initHeroSlider() {
    const track = document.getElementById('banner-track');
    const dotsContainer = document.getElementById('banner-dots');
    
    if (!track || !dotsContainer) return;
    
    const slides = track.children;
    const totalSlides = slides.length;
    
    dotsContainer.innerHTML = '';
    
    for (let i = 0; i < totalSlides; i++) {
        const dot = document.createElement('button');
        dot.className = `dot ${i === 0 ? 'active' : ''}`;
        dot.setAttribute('data-index', i);
        dot.addEventListener('click', () => goToSlide(i));
        dotsContainer.appendChild(dot);
    }
    
    let currentSlide = 0;
    let slideInterval;
    
    function goToSlide(index) {
        currentSlide = index;
        track.style.transform = `translateX(-${currentSlide * 100}%)`;
        
        document.querySelectorAll('#banner-dots .dot').forEach((dot, i) => {
            dot.classList.toggle('active', i === currentSlide);
        });
    }
    
    function startSlider() {
        slideInterval = setInterval(() => {
            currentSlide = (currentSlide + 1) % totalSlides;
            goToSlide(currentSlide);
        }, 5000);
    }
    
    function stopSlider() {
        clearInterval(slideInterval);
    }
    
    startSlider();
    
    const sliderContainer = document.querySelector('.banner-slider-container');
    if (sliderContainer) {
        sliderContainer.addEventListener('mouseenter', stopSlider);
        sliderContainer.addEventListener('mouseleave', startSlider);
    }
}

function initMobileMenu() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    if (!hamburger || !navMenu) return;
    
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
        document.body.classList.toggle('menu-open');
    });
    
    document.querySelectorAll('.nav-menu a').forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
            document.body.classList.remove('menu-open');
        });
    });
}

async function loadFeaturedVehicles() {
    const grid = document.getElementById('featured-vehicles-grid');
    if (!grid) return;
    
    grid.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Loading vehicles...</div>';
    
    try {
        const vehicles = window.allVehicles.filter(v => v.status === 'AVAILABLE').slice(0, 4);
        
        console.log("🏆 Featured vehicles:", vehicles);
        
        if (vehicles.length === 0) {
            grid.innerHTML = '<p class="no-vehicles">No featured vehicles available</p>';
            return;
        }
        
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
        
    } catch (error) {
        console.error("Error loading featured vehicles:", error);
        grid.innerHTML = '<p class="error">Error loading vehicles</p>';
    }
}

function loadYouTubeVideos() {
    const grid = document.getElementById('youtube-grid');
    if (!grid) return;
    
    const videos = getYouTubeVideosFromVehicles(window.allVehicles);
    
    if (videos.length === 0) {
        grid.innerHTML = '<p class="no-videos">No YouTube videos available</p>';
        return;
    }
    
    grid.innerHTML = videos.map(video => `
        <div class="youtube-card" onclick="window.open('${video.videoUrl}', '_blank')">
            <div class="youtube-thumbnail">
                <img src="${video.thumbnail}" alt="${video.title}" loading="lazy">
                <div class="play-button">
                    <i class="fas fa-play"></i>
                </div>
            </div>
            <div class="vehicle-info">
                <h3>${video.title}</h3>
                <p style="color: #FF0000; margin-top: 0.5rem;"><i class="fab fa-youtube"></i> Watch on YouTube</p>
            </div>
        </div>
    `).join('');
}

function setActiveNavLink() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-menu a').forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage || (currentPage === '' && href === 'index.html')) {
            link.classList.add('active');
        }
    });
}

// ========== MODAL FUNCTIONS ==========
window.openVehicleModal = function(vehicleId) {
    console.log("🔍 Opening modal for vehicle ID:", vehicleId);
    
    const id = typeof vehicleId === 'string' ? parseInt(vehicleId) : vehicleId;
    const vehicle = window.allVehicles.find(v => v.id === id);
    
    if (!vehicle) {
        console.error("❌ Vehicle not found!");
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
                    <i class="fas fa-check-circle" style="color: ${vehicle.status === 'AVAILABLE' ? '#4CAF50' : '#f44336'}"></i>
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

window.changeModalImage = function(src, element) {
    const mainImg = document.getElementById('modal-main-img');
    if (mainImg) mainImg.src = src;
    
    document.querySelectorAll('.modal-thumbnail').forEach(t => t.classList.remove('active'));
    element.classList.add('active');
};

window.shareVehicle = function(vehicleId) {
    const vehicle = window.allVehicles.find(v => v.id === vehicleId);
    if (!vehicle) return;
    
    const shareText = `Check out this ${vehicle.name} (${vehicle.year}) priced at ${formatPrice(vehicle.price)}`;
    
    if (navigator.share) {
        navigator.share({ title: vehicle.name, text: shareText, url: window.location.href });
    } else {
        navigator.clipboard.writeText(shareText);
        alert('Vehicle details copied to clipboard!');
    }
};

// Modal close handlers
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('vehicle-modal');
    if (!modal) return;
    
    const closeBtn = modal.querySelector('.modal-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.classList.remove('show');
            document.body.style.overflow = 'auto';
        });
    }
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('show');
            document.body.style.overflow = 'auto';
        }
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('show')) {
            modal.classList.remove('show');
            document.body.style.overflow = 'auto';
        }
    });
});
