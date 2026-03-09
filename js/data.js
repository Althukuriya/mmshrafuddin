// js/data.js
// Google Sheets CSV URL - YOUR NEW PUBLISHED LINK
const GOOGLE_SHEETS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSE1pstK8BTamjt-LTSDJ40d6OdayNmT5NQp1Y4inx6pvMuBQ68at3tbkJDyy6NiqMfOZ1mB9AXE6_v/pub?gid=1146903494&single=true&output=csv";

// Fallback demo data (ONLY used if fetch fails)
const DEMO_VEHICLES = [
    {
        id: 1,
        name: "DEMO: Honda Bike",
        type: "Bike",
        year: 2022,
        price: 20000,
        image: "https://images.unsplash.com/photo-1609630875171-b1321377ee65",
        images: ["https://images.unsplash.com/photo-1609630875171-b1321377ee65"],
        status: "AVAILABLE",
        youtube: ""
    },
    {
        id: 2,
        name: "DEMO: Yamaha Bike",
        type: "Bike",
        year: 2023,
        price: 39000,
        image: "https://plus.unsplash.com/premium_photo-1661963005592-182d602c6a3f",
        images: ["https://plus.unsplash.com/premium_photo-1661963005592-182d602c6a3f"],
        status: "SOLD",
        youtube: "https://youtu.be/tRSLXR4lVvg"
    }
];

// MAIN FUNCTION - FETCHES FROM GOOGLE SHEETS
async function fetchVehiclesFromSheet() {
    console.log("🔍 ATTEMPTING TO FETCH FROM GOOGLE SHEETS...");
    console.log("URL:", GOOGLE_SHEETS_CSV_URL);
    
    try {
        // Add cache busting
        const url = GOOGLE_SHEETS_CSV_URL + '&_=' + new Date().getTime();
        
        const response = await fetch(url, {
            method: 'GET',
            mode: 'cors',
            cache: 'no-cache'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const csvText = await response.text();
        console.log("✅ RAW CSV DATA RECEIVED");
        console.log("First 500 chars:", csvText.substring(0, 500));
        
        if (csvText.length < 10) {
            throw new Error("CSV data is too short");
        }
        
        const vehicles = parseCSV(csvText);
        
        if (vehicles.length > 0) {
            console.log(`✅ SUCCESS: Loaded ${vehicles.length} vehicles FROM GOOGLE SHEETS`);
            return vehicles;
        } else {
            console.log("⚠️ No vehicles found in sheet, using DEMO data");
            return DEMO_VEHICLES;
        }
    } catch (error) {
        console.error("❌ FAILED to fetch from Google Sheets:", error);
        console.log("⚠️ Using DEMO data instead");
        return DEMO_VEHICLES;
    }
}

// Parse CSV to vehicle objects - UPDATED for new column names
function parseCSV(csvText) {
    const lines = csvText.split('\n').filter(line => line.trim() !== '');
    
    if (lines.length < 2) {
        console.log("CSV has no data rows");
        return [];
    }
    
    // Get headers
    const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim());
    console.log("📋 CSV Headers from sheet:", headers);
    
    const vehicles = [];
    
    for (let i = 1; i < lines.length; i++) {
        try {
            // Parse CSV line properly
            const values = [];
            let currentValue = '';
            let insideQuotes = false;
            
            for (let char of lines[i]) {
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
            values.push(currentValue);
            
            // Helper function to get value by column name
            const getValue = (columnName) => {
                const index = headers.findIndex(h => 
                    h.toLowerCase().includes(columnName.toLowerCase()) || 
                    columnName.toLowerCase().includes(h.toLowerCase())
                );
                if (index !== -1 && values[index]) {
                    return values[index].replace(/^"|"$/g, '').trim();
                }
                return '';
            };
            
            // Get values using NEW column names
            const name = getValue('Vehicle Name');
            const type = getValue('Vehicle Type');
            const yearStr = getValue('Model Year');
            const priceStr = getValue('Price');
            const status = getValue('STATUS');
            
            // Get YouTube link
            let youtube = getValue('YouTube Video Link');
            
            // Get images - using NEW column names
            const images = [];
            
            // Main Image
            const mainImg = getValue('Vehicle Image Link (Main Image)');
            if (mainImg && mainImg.trim() !== '' && mainImg.startsWith('http')) {
                images.push(mainImg);
            }
            
            // Image 2
            const img2 = getValue('Vehicle Image 2 Link');
            if (img2 && img2.trim() !== '' && img2.startsWith('http')) {
                images.push(img2);
            }
            
            // Images 3-5
            const img3 = getValue('Vehicle Image 3');
            if (img3 && img3.trim() !== '' && img3.startsWith('http')) {
                images.push(img3);
            }
            
            const img4 = getValue('Vehicle Image 4');
            if (img4 && img4.trim() !== '' && img4.startsWith('http')) {
                images.push(img4);
            }
            
            const img5 = getValue('Vehicle Image 5');
            if (img5 && img5.trim() !== '' && img5.startsWith('http')) {
                images.push(img5);
            }
            
            // Parse year and price
            const year = parseInt(yearStr) || 2023;
            const price = parseFloat(priceStr) || 0;
            
            // Only add if we have valid data
            if (name && name !== 'Vehicle Name' && price > 0) {
                const vehicle = {
                    id: i,
                    name: name,
                    type: type || 'Car',
                    year: year,
                    price: price,
                    image: images.length > 0 ? images[0] : 'https://placehold.co/600x400/0A1929/FFFFFF?text=No+Image',
                    images: images.length > 0 ? images : ['https://placehold.co/600x400/0A1929/FFFFFF?text=No+Image'],
                    status: status || 'AVAILABLE',
                    youtube: youtube || '',
                };
                
                vehicles.push(vehicle);
                console.log(`  → Parsed: ${vehicle.name} (${vehicle.status})`);
            }
        } catch (err) {
            console.warn(`Error parsing row ${i}:`, err);
        }
    }
    
    console.log(`📊 Total vehicles parsed: ${vehicles.length}`);
    return vehicles;
}

// Get YouTube videos from vehicles
function getYouTubeVideosFromVehicles(vehicles) {
    return vehicles
        .filter(v => v.youtube && v.youtube.trim() !== '')
        .slice(0, 3)
        .map(v => ({
            id: v.id,
            title: v.name,
            thumbnail: v.image,
            videoUrl: v.youtube
        }));
}

// Format price in Rupees
function formatPrice(price) {
    if (!price) return '₹0';
    return `₹${price.toLocaleString('en-IN')}`;
}
