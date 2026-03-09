// js/data.js
// Google Sheets CSV URL - YOUR PUBLISHED LINK
const GOOGLE_SHEETS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRmqHEH0b4l4JYMIEM0N6hnH55elmZMKtBie2cDRYGDb_YGMAe0d7ZKe18srlr23ReTJWYv_ECfTSMm/pub?gid=596049360&single=true&output=csv";

// Fallback demo data
const DEMO_VEHICLES = [
    {
        id: 1,
        name: "Honda Civic 2022",
        type: "Car",
        year: 2022,
        price: 22000,
        image: "https://placehold.co/600x400/0A1929/FFFFFF?text=Honda+Civic",
        images: ["https://placehold.co/600x400/0A1929/FFFFFF?text=Honda+Civic+1"],
        status: "Available",
        youtube: ""
    }
];

// Main function to fetch vehicles from Google Sheets
async function fetchVehiclesFromSheet() {
    try {
        console.log("Fetching data from Google Sheets...");
        console.log("URL:", GOOGLE_SHEETS_CSV_URL);
        
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
        console.log("CSV data received, length:", csvText.length);
        console.log("First 200 chars:", csvText.substring(0, 200));
        
        if (csvText.length < 10) {
            throw new Error("CSV data is too short");
        }
        
        const vehicles = parseCSV(csvText);
        
        if (vehicles.length > 0) {
            console.log(`✅ Successfully loaded ${vehicles.length} vehicles from sheet`);
            return vehicles;
        } else {
            console.log("No vehicles found in sheet, using demo data");
            return DEMO_VEHICLES;
        }
    } catch (error) {
        console.error("❌ Error fetching from Google Sheets:", error);
        console.log("Using demo data instead");
        return DEMO_VEHICLES;
    }
}

// Parse CSV to vehicle objects - EXACT column matching
function parseCSV(csvText) {
    const lines = csvText.split('\n').filter(line => line.trim() !== '');
    
    if (lines.length < 2) {
        console.log("CSV has no data rows");
        return [];
    }
    
    // Get headers - EXACT matches
    const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim());
    console.log("CSV Headers:", headers);
    
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
            values.push(currentValue); // Add last value
            
            // Helper function to get value by EXACT column name
            const getValue = (columnName) => {
                const index = headers.findIndex(h => h.trim() === columnName);
                if (index !== -1 && values[index]) {
                    return values[index].replace(/^"|"$/g, '').trim();
                }
                return '';
            };
            
            // Get values using EXACT column names from your sheet
            const name = getValue('Vehicle Name');
            const type = getValue('Vehicle Type');
            const yearStr = getValue('Model Year');
            const priceStr = getValue('Price (INR or USD)');
            const status = getValue('STATUS');
            const youtube = getValue('YouTube Video Link (Optional Walkthrough/Review)');
            
            // Get all 5 images
            const images = [];
            const img1 = getValue('Vehicle Image 1 (Main Image)');
            const img2 = getValue('Vehicle Image 2');
            const img3 = getValue('Vehicle Image 3');
            const img4 = getValue('Vehicle Image 4');
            const img5 = getValue('Vehicle Image 5');
            
            if (img1 && img1.startsWith('http')) images.push(img1);
            if (img2 && img2.startsWith('http')) images.push(img2);
            if (img3 && img3.startsWith('http')) images.push(img3);
            if (img4 && img4.startsWith('http')) images.push(img4);
            if (img5 && img5.startsWith('http')) images.push(img5);
            
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
                    status: status || 'Available',
                    youtube: youtube || '',
                };
                
                vehicles.push(vehicle);
                console.log(`✅ Added vehicle: ${vehicle.name}`);
            }
        } catch (err) {
            console.warn(`Error parsing row ${i}:`, err);
        }
    }
    
    console.log(`📊 Parsed ${vehicles.length} vehicles from CSV`);
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
    return `₹${price.toLocaleString('en-IN')}`;
}
