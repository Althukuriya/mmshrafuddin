// js/data.js
// Global variable to store vehicles (accessible everywhere)
window.allVehicles = [];

const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSE1pstK8BTamjt-LTSDJ40d6OdayNmT5NQp1Y4inx6pvMuBQ68at3tbkJDyy6NiqMfOZ1mB9AXE6_v/pub?gid=1146903494&single=true&output=csv";

async function fetchVehiclesFromSheet() {
    console.log("🔍 Fetching vehicles from Google Sheets...");
    
    try {
        const response = await fetch(SHEET_URL + "&t=" + Date.now());
        const text = await response.text();
        console.log("✅ Data received, length:", text.length);

        const lines = text.split("\n");
        const vehicles = [];

        for (let i = 1; i < lines.length; i++) {
            // Skip empty lines
            if (!lines[i].trim()) continue;
            
            // Parse CSV properly (handling quotes)
            const row = parseCSVLine(lines[i]);
            
            // Check if we have valid data
            if (!row[1] || row[1] === '') continue;

            const status = (row[11] || "AVAILABLE").trim().toUpperCase();
            
            // Skip hidden vehicles
            if (status === "HIDE") continue;

            // Collect images
            const images = [];
            if (row[5] && row[5].startsWith('http')) images.push(row[5]);
            if (row[6] && row[6].startsWith('http')) images.push(row[6]);
            if (row[7] && row[7].startsWith('http')) images.push(row[7]);
            if (row[8] && row[8].startsWith('http')) images.push(row[8]);
            if (row[9] && row[9].startsWith('http')) images.push(row[9]);

            const vehicle = {
                id: i,
                name: row[1] || 'Unknown Vehicle',
                type: row[2] || 'Car',
                year: parseInt(row[3]) || 2023,
                price: parseFloat(row[4]) || 0,
                image: images[0] || "https://placehold.co/600x400/0A1929/FFFFFF?text=No+Image",
                images: images.length ? images : ["https://placehold.co/600x400/0A1929/FFFFFF?text=No+Image"],
                youtube: row[10] || "",
                status: status
            };
            
            vehicles.push(vehicle);
            console.log(`  ✅ Added: ${vehicle.name} (${vehicle.status})`);
        }

        console.log(`📊 Total vehicles loaded: ${vehicles.length}`);
        
        // Store in global variable
        window.allVehicles = vehicles;
        
        return vehicles;

    } catch (error) {
        console.error("❌ Sheet load failed:", error);
        return [];
    }
}

// Helper function to parse CSV line properly
function parseCSVLine(line) {
    const values = [];
    let currentValue = '';
    let insideQuotes = false;
    
    for (let char of line) {
        if (char === '"' && !insideQuotes) {
            insideQuotes = true;
        } else if (char === '"' && insideQuotes) {
            insideQuotes = false;
        } else if (char === ',' && !insideQuotes) {
            values.push(currentValue);
            currentValue = '';
        } else {
            currentValue += char;
        }
    }
    values.push(currentValue); // Add last value
    
    return values;
}

// Format price in INR
function formatPrice(price) {
    if (!price) return '₹0';
    return "₹" + Number(price).toLocaleString("en-IN");
}

// Extract YouTube videos from vehicles
function getYouTubeVideosFromVehicles(vehicles) {
    return vehicles
        .filter(v => v.youtube && v.youtube.trim() !== "")
        .slice(0, 3)
        .map(v => ({
            id: v.id,
            title: v.name,
            thumbnail: v.image,
            videoUrl: v.youtube
        }));
}