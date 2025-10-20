// =============================================================================
// EUROLEAGUE SCRAPER - CONFIGURATION (MODIFY THESE VALUES)
// =============================================================================

const CONFIGS = [
    {
        // URL to scrape
        URL: 'https://www.euroleaguebasketball.net/euroleague/stats/expanded/?size=1000&viewType=traditional&seasonMode=Single&statisticMode=perGame&seasonCode=E2024&sortDirection=ascending&statistic=',
        
        // CSS selector for the data table
        SELECTOR: '#main > section > div.lg\\:p-6.bg-light > div > div > div > div.complex-stat-table_shadowWrap__wIJgS.complex-stat-table__manyCols__o3_D4 > div > div',
        
        // Output filename (will be saved in results/ folder)
        FILENAME: '2024_clean.csv',
        
        // Wait time in seconds (for dynamic content to load)
        WAIT_TIME: 5,
        
        // Browser settings
        HEADLESS: true, // Set to false to see the browser window
        TIMEOUT: 30000, // Page load timeout in milliseconds
    },
    // {
    //     URL: 'https://www.euroleaguebasketball.net/euroleague/stats/expanded/?size=1000&viewType=traditional&seasonMode=Single&statisticMode=perGame&seasonCode=E2023&sortDirection=ascending&statistic=',
    //     SELECTOR: '#main > section > div.lg\\:p-6.bg-light > div > div > div > div.complex-stat-table_shadowWrap__wIJgS.complex-stat-table__manyCols__o3_D4 > div > div',
    //     FILENAME: '2023.csv',
    //     WAIT_TIME: 5,
    //     HEADLESS: true,
    //     TIMEOUT: 30000,
    // },
    // {
    //     URL: 'https://www.euroleaguebasketball.net/euroleague/stats/expanded/?size=1000&viewType=traditional&seasonMode=Single&statisticMode=perGame&seasonCode=E2022&sortDirection=ascending&statistic=',
    //     SELECTOR: '#main > section > div.lg\\:p-6.bg-light > div > div > div > div.complex-stat-table_shadowWrap__wIJgS.complex-stat-table__manyCols__o3_D4 > div > div',
    //     FILENAME: '2022.csv',
    //     WAIT_TIME: 5,
    //     HEADLESS: true,
    //     TIMEOUT: 30000,
    // },
    // {
    //     URL: 'https://www.euroleaguebasketball.net/euroleague/stats/expanded/?size=1000&viewType=traditional&seasonMode=Single&statisticMode=perGame&seasonCode=E2021&sortDirection=ascending&statistic=',
    //     SELECTOR: '#main > section > div.lg\\:p-6.bg-light > div > div > div > div.complex-stat-table_shadowWrap__wIJgS.complex-stat-table__manyCols__o3_D4 > div > div',
    //     FILENAME: '2021.csv',
    //     WAIT_TIME: 5,
    //     HEADLESS: true,
    //     TIMEOUT: 30000,
    // },
    {
        URL: 'https://www.euroleaguebasketball.net/euroleague/stats/expanded/?size=1000&viewType=traditional&seasonMode=Single&statisticMode=perGame&seasonCode=E2020&sortDirection=ascending&statistic=',
        SELECTOR: '#main > section > div.lg\\:p-6.bg-light > div > div > div > div.complex-stat-table_shadowWrap__wIJgS.complex-stat-table__manyCols__o3_D4 > div > div',
        FILENAME: '2020.csv',
        WAIT_TIME: 5,
        HEADLESS: true,
        TIMEOUT: 30000,
    }
];

// =============================================================================
// SCRAPER CODE (DO NOT MODIFY BELOW THIS LINE)
// =============================================================================

const puppeteer = require('puppeteer');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const fs = require('fs');
const path = require('path');

class EuroLeagueScraper {
    constructor(config) {
        this.config = config;
        this.browser = null;
        this.page = null;
    }

    async init() {
        console.log('🚀 Starting browser...');
        this.browser = await puppeteer.launch({
            headless: this.config.HEADLESS ? 'new' : false,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        this.page = await this.browser.newPage();
        
        // Set user agent to avoid detection
        await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    }

    async scrape() {
        try {
            console.log(`📡 Navigating to: ${this.config.URL}`);
            await this.page.goto(this.config.URL, { 
                waitUntil: 'networkidle2',
                timeout: this.config.TIMEOUT 
            });

            console.log('🔍 Extracting data...');
            const data = await this.page.evaluate(() => {
                const results = [];
                
                // Find all table rows
                const rows = document.querySelectorAll('.complex-stat-table_row__XPRhI');
                
                rows.forEach((row, index) => {
                    // Skip header rows or rows that contain "Team" or other header text
                    const rowText = row.textContent.toLowerCase();
                    if (rowText.includes('team') || rowText.includes('player') || rowText.includes('rank') || rowText.includes('games played')) {
                        return; // Skip this row
                    }
                    const rowData = {
                        rank: '',
                        player_name: '',
                        team: '',
                        games_played: '',
                        games_started: '',
                        minutes: '',
                        points: '',
                        two_point_made: '',
                        two_point_attempted: '',
                        two_point_percentage: '',
                        three_point_made: '',
                        three_point_attempted: '',
                        three_point_percentage: '',
                        free_throws_made: '',
                        free_throws_attempted: '',
                        free_throw_percentage: '',
                        offensive_rebounds: '',
                        defensive_rebounds: '',
                        total_rebounds: '',
                        assists: '',
                        steals: '',
                        turnovers: '',
                        blocks: '',
                        blocks_against: '',
                        fouls_committed: '',
                        fouls_drawn: '',
                        performance_index_rating: ''
                    };
                    
                    // Get all cells in the row
                    const cells = row.querySelectorAll('p.font-modelica.text-primary.text-sm.font-normal.complex-stat-table_cell__XIEO5');
                    const allStats = Array.from(cells).map(cell => cell.textContent.trim());
                    
                    // Extract player name and team from specific elements
                    const playerLink = row.querySelector('.complex-stat-table_playerLink__y9Nyp');
                    if (playerLink) {
                        const longName = playerLink.querySelector('.complex-stat-table_longValue__c7emT');
                        const shortName = playerLink.querySelector('.complex-stat-table_shortValue__5WGW6');
                        rowData.player_name = longName ? longName.textContent.trim() : (shortName ? shortName.textContent.trim() : '');
                    }
                    
                    // Extract team from the team cell (look for the cell that contains team abbreviation)
                    const teamCells = row.querySelectorAll('.complex-stat-table_cell__XIEO5');
                    for (let i = 0; i < teamCells.length; i++) {
                        const cellText = teamCells[i].textContent.trim();
                        // Look for team abbreviation (usually 3-4 characters, not a number)
                        if (cellText.length >= 2 && cellText.length <= 4 && isNaN(cellText) && !cellText.includes('%') && !cellText.includes(':') && !cellText.includes('.')) {
                            rowData.team = cellText;
                            break;
                        }
                    }
                    
                    // Map the stats array to our data structure
                    // The stats array should contain: rank, games_played, games_started, minutes, points, etc.
                    if (allStats.length >= 25) {
                        rowData.rank = allStats[0] || '';
                        rowData.games_played = allStats[1] || '';
                        rowData.games_started = allStats[2] || '';
                        rowData.minutes = allStats[3] || '';
                        rowData.points = allStats[4] || '';
                        rowData.two_point_made = allStats[5] || '';
                        rowData.two_point_attempted = allStats[6] || '';
                        rowData.two_point_percentage = allStats[7] || '';
                        rowData.three_point_made = allStats[8] || '';
                        rowData.three_point_attempted = allStats[9] || '';
                        rowData.three_point_percentage = allStats[10] || '';
                        rowData.free_throws_made = allStats[11] || '';
                        rowData.free_throws_attempted = allStats[12] || '';
                        rowData.free_throw_percentage = allStats[13] || '';
                        rowData.offensive_rebounds = allStats[14] || '';
                        rowData.defensive_rebounds = allStats[15] || '';
                        rowData.total_rebounds = allStats[16] || '';
                        rowData.assists = allStats[17] || '';
                        rowData.steals = allStats[18] || '';
                        rowData.turnovers = allStats[19] || '';
                        rowData.blocks = allStats[20] || '';
                        rowData.blocks_against = allStats[21] || '';
                        rowData.fouls_committed = allStats[22] || '';
                        rowData.fouls_drawn = allStats[23] || '';
                        rowData.performance_index_rating = allStats[24] || '';
                    }
                    
                    // If we still don't have a rank, use the index
                    if (!rowData.rank || rowData.rank === '') {
                        rowData.rank = (index + 1).toString();
                    }
                    
                    results.push(rowData);
                });
                
                return results;
            });

            console.log(`✅ Found ${data.length} player records`);
            return data;

        } catch (error) {
            console.error('❌ Error during scraping:', error.message);
            throw error;
        }
    }

    async exportToCSV(data) {
        if (!data || data.length === 0) {
            console.log('⚠️  No data to export');
            return;
        }

        const resultsDir = path.join(__dirname, 'results');
        if (!fs.existsSync(resultsDir)) {
            fs.mkdirSync(resultsDir, { recursive: true });
        }

        const filePath = path.join(resultsDir, this.config.FILENAME);
        
        // Define proper headers for Excel compatibility
        const headers = [
            { id: 'rank', title: 'Rank' },
            { id: 'player_name', title: 'Player Name' },
            { id: 'team', title: 'Team' },
            { id: 'games_played', title: 'Games Played' },
            { id: 'games_started', title: 'Games Started' },
            { id: 'minutes', title: 'Minutes' },
            { id: 'points', title: 'Points' },
            { id: 'two_point_made', title: '2PM' },
            { id: 'two_point_attempted', title: '2PA' },
            { id: 'two_point_percentage', title: '2P%' },
            { id: 'three_point_made', title: '3PM' },
            { id: 'three_point_attempted', title: '3PA' },
            { id: 'three_point_percentage', title: '3P%' },
            { id: 'free_throws_made', title: 'FTM' },
            { id: 'free_throws_attempted', title: 'FTA' },
            { id: 'free_throw_percentage', title: 'FT%' },
            { id: 'offensive_rebounds', title: 'OR' },
            { id: 'defensive_rebounds', title: 'DR' },
            { id: 'total_rebounds', title: 'TR' },
            { id: 'assists', title: 'AST' },
            { id: 'steals', title: 'STL' },
            { id: 'turnovers', title: 'TO' },
            { id: 'blocks', title: 'BLK' },
            { id: 'blocks_against', title: 'BLKA' },
            { id: 'fouls_committed', title: 'FC' },
            { id: 'fouls_drawn', title: 'FD' },
            { id: 'performance_index_rating', title: 'PIR' }
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

async function scrapeSeason(config, seasonIndex, totalSeasons) {
    const scraper = new EuroLeagueScraper(config);
    
    try {
        console.log(`\n🏀 Scraping Season ${seasonIndex + 1}/${totalSeasons}`);
        console.log(`📊 Target: ${config.URL}`);
        console.log(`📁 Output: results/${config.FILENAME}`);
        console.log(`⏱️  Wait time: ${config.WAIT_TIME} seconds`);
        console.log('─'.repeat(60));
        
        await scraper.init();
        
        // Wait for dynamic content
        if (config.WAIT_TIME > 0) {
            console.log(`⏳ Waiting ${config.WAIT_TIME} seconds for content to load...`);
            await new Promise(resolve => setTimeout(resolve, config.WAIT_TIME * 1000));
        }
        
        // Scrape data
        const data = await scraper.scrape();
        
        // Export to CSV
        await scraper.exportToCSV(data);
        
        console.log('─'.repeat(60));
        console.log(`✅ Season ${seasonIndex + 1} completed successfully!`);
        console.log(`📊 Data saved to: results/${config.FILENAME}`);
        
        return true;
        
    } catch (error) {
        console.error(`💥 Season ${seasonIndex + 1} failed:`, error.message);
        return false;
    } finally {
        await scraper.close();
    }
}

async function main() {
    console.log('🏀 Starting EuroLeague Multi-Season Stats Scraper...');
    console.log(`📊 Total seasons to scrape: ${CONFIGS.length}`);
    console.log('═'.repeat(60));
    
    let successCount = 0;
    let failCount = 0;
    
    for (let i = 0; i < CONFIGS.length; i++) {
        const config = CONFIGS[i];
        const success = await scrapeSeason(config, i, CONFIGS.length);
        
        if (success) {
            successCount++;
        } else {
            failCount++;
        }
        
        // Add a small delay between seasons to be respectful to the server
        if (i < CONFIGS.length - 1) {
            console.log('\n⏳ Waiting 3 seconds before next season...');
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
    }
    
    console.log('\n' + '═'.repeat(60));
    console.log('🎉 All seasons scraping completed!');
    console.log(`✅ Successful: ${successCount}/${CONFIGS.length} seasons`);
    console.log(`❌ Failed: ${failCount}/${CONFIGS.length} seasons`);
    
    if (failCount > 0) {
        console.log('⚠️  Some seasons failed. Check the error messages above.');
        process.exit(1);
    }
}

// Run the scraper
main();
