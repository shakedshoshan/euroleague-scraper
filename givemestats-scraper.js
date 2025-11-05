// =============================================================================
// GIVEMESTATS SCRAPER - CONFIGURATION (MODIFY THESE VALUES)
// =============================================================================

const CONFIGS = {
    // URL to scrape
    URL: 'https://givemestats.com/euroleague-fantasy-domestic-stats/?sortby=minutes&index=all&minutes=all&stage=Regular%20season&period=na&euroleagueFantasyPrice=all',
    
    // CSS selector for the data table
    SELECTOR: '#filterableTable',
    
    // Output filename
    FILENAME: 'givemestats_domestic_stats.csv',
    
    // Wait time in seconds (for dynamic content to load)
    WAIT_TIME: 5,
    
    // Browser settings
    HEADLESS: true, // Set to false to see the browser window
    TIMEOUT: 30000, // Page load timeout in milliseconds
};

// =============================================================================
// SCRAPER CODE (DO NOT MODIFY BELOW THIS LINE)
// =============================================================================

const puppeteer = require('puppeteer');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const fs = require('fs');
const path = require('path');

class GiveMeStatsScraper {
    constructor(configs) {
        this.configs = configs;
        this.browser = null;
        this.page = null;
    }

    async init() {
        console.log('🚀 Starting browser...');
        this.browser = await puppeteer.launch({
            headless: this.configs.HEADLESS ? 'new' : false,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        this.page = await this.browser.newPage();
        
        // Set user agent to avoid detection
        await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    }

    async scrape() {
        try {
            console.log(`📡 Navigating to: ${this.configs.URL}`);
            await this.page.goto(this.configs.URL, { 
                waitUntil: 'networkidle2',
                timeout: this.configs.TIMEOUT 
            });

            console.log(`⏳ Waiting ${this.configs.WAIT_TIME} seconds for content to load...`);
            await this.page.waitForTimeout(this.configs.WAIT_TIME * 1000);

            console.log('🔍 Extracting data from table...');
            const data = await this.page.evaluate((selector) => {
                const results = [];
                
                // Find the table
                const table = document.querySelector(selector);
                if (!table) {
                    console.log('Table not found with selector:', selector);
                    return results;
                }
                
                // Find the header row to identify column indices
                const headerRow = table.querySelector('thead tr') || table.querySelector('tr');
                if (!headerRow) {
                    console.log('Header row not found');
                    return results;
                }
                
                const headerCells = headerRow.querySelectorAll('th, td');
                let playerColumnIndex = -1;
                let fantasyPriceColumnIndex = -1;
                
                // Find the indices of "Player" and "Fantasy price" columns
                headerCells.forEach((cell, index) => {
                    const text = cell.textContent.trim().toLowerCase();
                    if (text.includes('player') && playerColumnIndex === -1) {
                        playerColumnIndex = index;
                    }
                    if ((text.includes('fantasy') && text.includes('price')) || 
                        (text.includes('fantasy price')) || 
                        (text === 'fantasy price')) {
                        fantasyPriceColumnIndex = index;
                    }
                });
                
                console.log(`Player column index: ${playerColumnIndex}, Fantasy price column index: ${fantasyPriceColumnIndex}`);
                
                if (playerColumnIndex === -1 || fantasyPriceColumnIndex === -1) {
                    console.log('Could not find required columns in header');
                    // Log all header texts for debugging
                    const headerTexts = Array.from(headerCells).map(cell => cell.textContent.trim());
                    console.log('Available headers:', headerTexts);
                    return results;
                }
                
                // Find all data rows
                const rows = table.querySelectorAll('tbody tr');
                if (rows.length === 0) {
                    // If no tbody, try all tr elements (skip header)
                    const allRows = table.querySelectorAll('tr');
                    rows = Array.from(allRows).slice(1); // Skip first row (header)
                }
                
                rows.forEach((row) => {
                    const cells = row.querySelectorAll('td, th');
                    
                    // Skip if not enough cells
                    if (cells.length <= Math.max(playerColumnIndex, fantasyPriceColumnIndex)) {
                        return;
                    }
                    
                    const playerName = cells[playerColumnIndex]?.textContent.trim() || '';
                    const fantasyPrice = cells[fantasyPriceColumnIndex]?.textContent.trim() || '';
                    
                    // Only add if we have player name
                    if (playerName && playerName !== '') {
                        // Clean up player name - remove any links or extra formatting
                        const cleanPlayerName = playerName.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
                        
                        results.push({
                            player: cleanPlayerName,
                            fantasy_price: fantasyPrice
                        });
                    }
                });
                
                return results;
            }, this.configs.SELECTOR);

            console.log(`✅ Found ${data.length} player records`);
            return data;

        } catch (error) {
            console.error('❌ Error during scraping:', error.message);
            throw error;
        }
    }

    async exportToCSV(data, filePath) {
        const headers = [
            { id: 'player', title: 'Player' },
            { id: 'fantasy_price', title: 'Fantasy price' }
        ];

        const csvWriter = createCsvWriter({
            path: filePath,
            header: headers
        });

        await csvWriter.writeRecords(data);
        console.log(`💾 Data exported to: ${filePath}`);
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
            console.log('🔒 Browser closed');
        }
    }
}

// =============================================================================
// MAIN EXECUTION
// =============================================================================

async function main() {
    const scraper = new GiveMeStatsScraper(CONFIGS);
    
    try {
        await scraper.init();
        const data = await scraper.scrape();
        
        if (data.length > 0) {
            // Create results folder if it doesn't exist
            const resultsFolder = path.join(__dirname, 'results');
            if (!fs.existsSync(resultsFolder)) {
                fs.mkdirSync(resultsFolder, { recursive: true });
                console.log(`📁 Created folder: ${resultsFolder}`);
            }
            
            const filePath = path.join(resultsFolder, CONFIGS.FILENAME);
            await scraper.exportToCSV(data, filePath);
            console.log(`\n🎉 Scraping completed successfully!`);
            console.log(`📊 Total records: ${data.length}`);
        } else {
            console.log('⚠️  No data found to export');
        }
    } catch (error) {
        console.error('💥 Scraping failed:', error.message);
        process.exit(1);
    } finally {
        await scraper.close();
    }
}

// Run the scraper
main();

