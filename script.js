/* ============================================================================
   ToolStruct - JavaScript Functionality
   Handles page navigation and solar panel calculator logic
   ============================================================================ */

/* ============================================================================
   0. BUSINESS CONFIGURATION
   ============================================================================
   Centralized configuration for all calculators. Update these values
   directly without modifying calculation logic.
   ============================================================================ */

const CALCULATOR_CONFIG = {
    // CEMENT CALCULATOR SETTINGS
    cement: {
        bagWeightKg: 50,                    // Standard cement bag weight in kg
        minBagsPerM3: 8,                    // Minimum bags per cubic meter (light mix)
        maxBagsPerM3: 10,                   // Maximum bags per cubic meter (heavy duty mix)
        thicknessCmToMeters: 0.01,          // Conversion factor: cm to meters
    },
    
    // SOLAR CALCULATOR SETTINGS
    solar: {
        electricityRateZAR: 3.75,           // ZAR per kWh (2026 estimate)
        daysPerMonth: 30,                   // Days used for monthly calculations
        peakSunHours: 4.5,                  // Average peak sun hours in South Africa
        efficiencyBuffer: 1.25,             // 25% buffer for losses & cloudy days
        panelWattage: 400,                  // Standard residential panel wattage
        wattagePerKw: 1000,                 // Watts per kilowatt
        panelFlexibilityRange: 2,           // ±2 panels for flexibility in recommendations
        dCtoACConversionLoss: 1.1,          // Account for DC to AC conversion ~10% loss
    }
};

/* ============================================================================
   1. INITIALIZATION & DOM READY
   ============================================================================ */

document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
});

/* ============================================================================
   2. EVENT LISTENERS SETUP
   ============================================================================ */

function initializeEventListeners() {
    // Navigation links
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', handleNavClick);
    });

    // Mobile menu button
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', toggleMobileMenu);
    }

    // Logo click - go home
    const logo = document.querySelector('.logo');
    if (logo) {
        logo.addEventListener('click', () => navigateToPage('home'));
    }

    // Hero button - open solar calculator
    const heroButton = document.getElementById('heroButton');
    if (heroButton) {
        heroButton.addEventListener('click', () => navigateToPage('solar'));
    }

    // Solar calculator form
    const solarForm = document.getElementById('solarForm');
    if (solarForm) {
        solarForm.addEventListener('submit', calculateSolarSystem);
    }

    // Recalculate button
    const recalculateBtn = document.getElementById('recalculateBtn');
    if (recalculateBtn) {
        recalculateBtn.addEventListener('click', scrollToForm);
    }

    // Cement calculator form
    const cementForm = document.getElementById('cementForm');
    if (cementForm) {
        cementForm.addEventListener('submit', calculateCementSystem);
    }

    // Recalculate button for cement
    const recalculateCementBtn = document.getElementById('recalculateCementBtn');
    if (recalculateCementBtn) {
        recalculateCementBtn.addEventListener('click', scrollToCementForm);
    }

    // Close mobile menu when clicking on a link
    navLinks.forEach(link => {
        link.addEventListener('click', closeMobileMenu);
    });

    // Initialize cookie consent banner
    initializeCookieConsent();
}

/* ============================================================================
   3. NAVIGATION FUNCTIONS
   ============================================================================ */

/**
 * Handles navigation link clicks
 * Extracts the page name from the data-page attribute
 * If no data-page attribute, allows normal link navigation (external pages like privacy.html)
 */
function handleNavClick(event) {
    const page = event.target.getAttribute('data-page');
    
    // Only prevent default and navigate if this is an internal page
    if (page) {
        event.preventDefault();
        navigateToPage(page);
    }
    // Otherwise, allow normal link navigation (e.g., to privacy.html)
}

/**
 * Navigates to a specific page by showing/hiding sections
 * @param {string} pageName - The name of the page to navigate to ('home', 'solar', 'construction')
 */
function navigateToPage(pageName) {
    // Hide all pages
    const allPages = document.querySelectorAll('.page');
    allPages.forEach(page => {
        page.classList.remove('active');
    });

    // Show the requested page
    const pageToShow = document.getElementById(pageName + 'Page');
    if (pageToShow) {
        pageToShow.classList.add('active');
        window.scrollTo(0, 0);
    }

    // Update active navigation link
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-page') === pageName) {
            link.classList.add('active');
        }
    });

    // Close mobile menu
    closeMobileMenu();
}

/* ============================================================================
   4. MOBILE MENU FUNCTIONS
   ============================================================================ */

/**
 * Toggles the mobile navigation menu
 */
function toggleMobileMenu() {
    const navLinks = document.getElementById('navLinks');
    navLinks.classList.toggle('active');
}

/**
 * Closes the mobile navigation menu
 */
function closeMobileMenu() {
    const navLinks = document.getElementById('navLinks');
    navLinks.classList.remove('active');
}

/* ============================================================================
   5. SOLAR CALCULATOR LOGIC
   ============================================================================ */

/**
 * Calculates solar system requirements based on user inputs
 * This function uses South African electricity rates and solar panel specifications
 * @param {Event} event - The form submission event
 */
function calculateSolarSystem(event) {
    event.preventDefault();

    // Get input values from form
    const monthlyBill = parseFloat(document.getElementById('monthlyBill').value) || 0;
    const monthlyKwh = parseFloat(document.getElementById('monthlyKwh').value) || 0;

    // Validate inputs - user must provide at least one
    if (monthlyBill === 0 && monthlyKwh === 0) {
        alert('Please enter either a monthly bill amount or monthly kWh usage');
        return;
    }

    // =====================================================================
    // CALCULATION ENGINE
    // =====================================================================

    let monthlyConsumption; // Will be in kWh

    // If kWh is provided, use it directly
    if (monthlyKwh > 0) {
        monthlyConsumption = monthlyKwh;
    } else {
        // Otherwise, calculate from bill using configured electricity rate
        const electricityRate = CALCULATOR_CONFIG.solar.electricityRateZAR;
        monthlyConsumption = monthlyBill / electricityRate;
    }

    // Calculate daily consumption using configured days per month
    const dailyConsumption = monthlyConsumption / CALCULATOR_CONFIG.solar.daysPerMonth;

    // Calculate system size needed
    // Using configured peak sun hours and efficiency buffer
    const peakSunHours = CALCULATOR_CONFIG.solar.peakSunHours;
    const efficiencyBuffer = CALCULATOR_CONFIG.solar.efficiencyBuffer;
    const systemSize = (dailyConsumption / peakSunHours) * efficiencyBuffer;
    
    // Round system size to nearest 0.5 kW for cleaner presentation
    const systemSizeRounded = Math.round(systemSize * 2) / 2;

    // Calculate number of solar panels needed using configured panel wattage
    const panelWattage = CALCULATOR_CONFIG.solar.panelWattage;
    const wattagePerKw = CALCULATOR_CONFIG.solar.wattagePerKw;
    const systemSizeWatts = systemSizeRounded * wattagePerKw;
    const panelsNeeded = Math.ceil(systemSizeWatts / panelWattage);

    // Create panel range using configured flexibility
    const panelFlexibilityRange = CALCULATOR_CONFIG.solar.panelFlexibilityRange;
    const panelsMin = Math.max(panelsNeeded - panelFlexibilityRange, 1);
    const panelsMax = panelsNeeded + panelFlexibilityRange;
    
    // Battery sizing - Use market-realistic ranges for South African buyers
    // Common backup sizes: 2.56 kWh, 5.12 kWh, and multiples
    let batteryMin, batteryMax;
    
    if (dailyConsumption < 5) {
        // Small usage: typical backup solutions are 2.5–5 kWh
        batteryMin = 2.5;
        batteryMax = 5;
    } else if (dailyConsumption < 10) {
        // Medium usage: 5–10 kWh systems
        batteryMin = 5;
        batteryMax = 10;
    } else if (dailyConsumption < 20) {
        // Higher usage: 10–15 kWh systems
        batteryMin = 10;
        batteryMax = 15;
    } else {
        // Very high usage: 15+ kWh systems
        batteryMin = 15;
        batteryMax = Math.ceil(dailyConsumption * 0.5);
    }

    // Load shedding status based on daily consumption and battery
    // Be honest about dependencies - what you can actually back up depends on 
    // which loads are included, inverter size, and usage patterns
    let loadSheddingStatus;
    if (dailyConsumption < 5) {
        loadSheddingStatus = "Suitable for essential loads and critical appliances only";
    } else if (dailyConsumption < 10) {
        loadSheddingStatus = "Can support essential home loads during typical outages";
    } else if (dailyConsumption < 20) {
        loadSheddingStatus = "Suitable for strong backup coverage for many homes";
    } else {
        loadSheddingStatus = "Capable of supporting most home loads with proper design";
    }

    // Calculate coverage dynamically based on system size
    // This is highly dependent on location, weather, roof angle, shading, and usage patterns
    // Use qualitative descriptions that are honest about variability
    let coverage;
    if (systemSizeRounded < 2) {
        coverage = "Moderate daytime solar support";
    } else if (systemSizeRounded < 4) {
        coverage = "Good daytime solar support";
    } else if (systemSizeRounded < 8) {
        coverage = "Strong daytime solar support (battery covers evening/night)";
    } else {
        coverage = "Substantial solar support (excellent with battery backup)";
    }

    // =====================================================================
    // DISPLAY RESULTS
    // =====================================================================

    // Update result values in the DOM - in professional order
    // First: Show the estimated usage
    document.getElementById('monthlyUsageValue').textContent = monthlyConsumption.toFixed(0);
    
    // System size - rounded for cleaner look
    document.getElementById('systemSize').textContent = systemSizeRounded.toFixed(1);
    
    // Panels needed - show with confidence and specificity
    document.getElementById('panelsNeeded').textContent = `≈ ${panelsNeeded} (400W)`;
    
    // Battery size - show as realistic range for essential loads
    document.getElementById('batterySize').textContent = `${batteryMin}–${batteryMax}`;
    
    // Daily usage and coverage (now dynamic!)
    document.getElementById('dailyUsage').textContent = dailyConsumption.toFixed(2);
    document.getElementById('coverage').textContent = coverage;
    document.getElementById('loadSheddingStatus').textContent = loadSheddingStatus;

    // Show results container
    const resultsContainer = document.getElementById('resultsContainer');
    resultsContainer.style.display = 'block';

    // Smooth scroll to results
    setTimeout(() => {
        resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
}

/**
 * Scrolls back to the calculator form
 * Called when user clicks "Recalculate" button
 */
function scrollToForm() {
    const form = document.getElementById('solarForm');
    form.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

/**
 * Scrolls back to the cement calculator form
 * Called when user clicks "Recalculate" button
 */
function scrollToCementForm() {
    const form = document.getElementById('cementForm');
    form.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

/* ============================================================================
   7. CEMENT CALCULATOR LOGIC
   ============================================================================ */

/**
 * Calculates cement requirements based on concrete dimensions
 * @param {Event} event - The form submission event
 */
function calculateCementSystem(event) {
    event.preventDefault();

    // Get input values from form
    const length = parseFloat(document.getElementById('concreteLength').value) || 0;
    const width = parseFloat(document.getElementById('concreteWidth').value) || 0;
    const thicknessCm = parseFloat(document.getElementById('concreteThickness').value) || 0;

    // Validate inputs
    if (length <= 0 || width <= 0 || thicknessCm <= 0) {
        alert('Please enter valid measurements for all fields');
        return;
    }

    // =====================================================================
    // CALCULATION ENGINE
    // =====================================================================

    // Convert thickness from cm to meters
    const thicknessM = thicknessCm * CALCULATOR_CONFIG.cement.thicknessCmToMeters;

    // Calculate area (m²)
    const area = length * width;

    // Calculate volume (m³)
    const volume = area * thicknessM;

    // Calculate cement bags needed using configuration values
    // South African concrete standard: min-max bags per m³
    const minBagsPerM3 = CALCULATOR_CONFIG.cement.minBagsPerM3;
    const maxBagsPerM3 = CALCULATOR_CONFIG.cement.maxBagsPerM3;
    const bagWeightKg = CALCULATOR_CONFIG.cement.bagWeightKg;
    
    const minCementBags = Math.ceil(volume * minBagsPerM3);
    const maxCementBags = Math.ceil(volume * maxBagsPerM3);

    // Calculate total weight of cement (kg) - using both min and max
    const minCementWeightKg = minCementBags * bagWeightKg;
    const maxCementWeightKg = maxCementBags * bagWeightKg;

    // =====================================================================
    // DISPLAY RESULTS
    // =====================================================================

    // Update result values in the DOM
    document.getElementById('concreteVolume').textContent = volume.toFixed(3);
    document.getElementById('cementBagsNeeded').textContent = `${minCementBags}–${maxCementBags}`;
    document.getElementById('concreteArea').textContent = area.toFixed(2);
    document.getElementById('concreteThicknessDisplay').textContent = thicknessCm;
    document.getElementById('volumeCalculation').textContent = `${length} × ${width} × ${thicknessM}m`;
    document.getElementById('cementRatioDisplay').textContent = `${minBagsPerM3}–${maxBagsPerM3}`;
    document.getElementById('cementWeight').textContent = `${minCementWeightKg.toLocaleString('en-ZA')}–${maxCementWeightKg.toLocaleString('en-ZA')}`;

    // Show results container
    const resultsContainer = document.getElementById('cementResultsContainer');
    resultsContainer.style.display = 'block';

    // Smooth scroll to results
    setTimeout(() => {
        resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
}

/* ============================================================================
   6. UTILITY FUNCTIONS
   ============================================================================ */

/**
 * Formats a number as South African currency (ZAR)
 * @param {number} amount - The amount to format
 * @returns {string} Formatted currency string
 */
function formatCurrency(amount) {
    return 'R' + amount.toLocaleString('en-ZA', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

/* ============================================================================
   7. ACCESSIBILITY & ENHANCEMENTS
   ============================================================================ */

// Add keyboard navigation support
document.addEventListener('keydown', function(event) {
    // ESC key closes mobile menu
    if (event.key === 'Escape') {
        closeMobileMenu();
    }
});

// Prevent form submission via Enter key on number inputs (except submit button)
document.querySelectorAll('input[type="number"]').forEach(input => {
    input.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            document.getElementById('solarForm').dispatchEvent(new Event('submit'));
        }
    });
});

/* ============================================================================
   8. COOKIE CONSENT MANAGEMENT
   ============================================================================ */

/**
 * Initialize cookie consent banner
 * Shows banner if cookies not yet accepted, hides if already accepted
 */
function initializeCookieConsent() {
    const cookieBanner = document.getElementById('cookieBanner');
    const acceptBtn = document.getElementById('acceptCookies');
    
    // Check if cookies already accepted
    const cookiesAccepted = localStorage.getItem('toolstruct_cookies_accepted');
    
    if (cookiesAccepted === 'true') {
        // Hide banner if already accepted
        if (cookieBanner) {
            cookieBanner.classList.add('hidden');
        }
    } else {
        // Show banner if not accepted
        if (cookieBanner) {
            cookieBanner.classList.remove('hidden');
        }
    }
    
    // Handle accept button click
    if (acceptBtn) {
        acceptBtn.addEventListener('click', function() {
            localStorage.setItem('toolstruct_cookies_accepted', 'true');
            if (cookieBanner) {
                cookieBanner.classList.add('hidden');
            }
        });
    }
    
    // Handle decline button click
    const declineBtn = document.getElementById('declineCookies');
    if (declineBtn) {
        declineBtn.addEventListener('click', function() {
            localStorage.setItem('toolstruct_cookies_accepted', 'declined');
            if (cookieBanner) {
                cookieBanner.classList.add('hidden');
            }
        });
    }
}

/* ============================================================================
   9. COMMENTS & CODE STRUCTURE
   ============================================================================ */

/*
ABOUT THIS CODE:

1. INITIALIZATION
   - All event listeners are set up when the DOM is ready
   - This ensures all elements exist before attaching listeners

2. NAVIGATION
   - Simple page switching system using data-page attributes
   - Mobile menu toggle for small screens
   - Smooth scrolling to top when navigating

3. SOLAR CALCULATOR
   - Uses realistic South African electricity rates
   - Peak sun hours set to 4.5 (typical for South Africa)
   - Includes efficiency buffer (25%) for real-world performance
   - Battery sizing accounts for load shedding scenario
   - All calculations happen on the client (no server requests)

4. DESIGN PHILOSOPHY
   - Vanilla JavaScript (no frameworks)
   - Event delegation where possible
   - Clear function naming and comments
   - Mobile-first responsive approach
   - All data is processed locally and never stored

5. PERFORMANCE
   - Minimal DOM manipulation
   - Smooth animations with CSS transitions
   - Fast calculation engine
   - No external dependencies
*/
