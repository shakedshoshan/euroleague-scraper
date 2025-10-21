// =============================================================================
// EUROLEAGUE SCRAPER - CONFIGURATION (MODIFY THESE VALUES)
// =============================================================================

const CONFIGS = [
    {
        // URL to scrape
        URL: 'https://www.dunkest.com/en/euroleague/stats/players/table?season_id=23&mode=dunkest&stats_type=tot&weeks[]=5&rounds[]=1&rounds[]=2&teams[]=32&teams[]=33&teams[]=34&teams[]=35&teams[]=36&teams[]=37&teams[]=38&teams[]=39&teams[]=40&teams[]=41&teams[]=42&teams[]=43&teams[]=44&teams[]=45&teams[]=46&teams[]=47&teams[]=48&teams[]=56&teams[]=60&teams[]=75&positions[]=1&positions[]=2&positions[]=3&player_search=&min_cr=4&max_cr=35&sort_by=pdk&sort_order=desc&iframe=yes&noadv=yes',
        
        // CSS selector for the data table
        SELECTOR: 'body > main > div.mt-4.table-stats__container > table',
        
        // Output filename (will be saved in results/ folder)
        FILENAME: 'dunkest_2024.csv',
        
        // Wait time in seconds (for dynamic content to load)
        WAIT_TIME: 5,
        
        // Browser settings
        HEADLESS: true, // Set to false to see the browser window
        TIMEOUT: 30000, // Page load timeout in milliseconds
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
                
                // Try multiple selectors to find the table
                let table = document.querySelector('body > main > div.mt-4.table-stats__container > table');
                if (!table) {
                    // Try alternative selectors
                    table = document.querySelector('table');
                    if (!table) {
                        table = document.querySelector('.table-stats__container table');
                    }
                }
                
                if (!table) {
                    console.log('Table not found with any selector');
                    return results;
                }
                
                // Find all table rows (skip header row)
                let rows = table.querySelectorAll('tbody tr');
                if (rows.length === 0) {
                    // If no tbody, try all tr elements
                    rows = table.querySelectorAll('tr');
                }
                
                rows.forEach((row, index) => {
                    // Skip header rows or empty rows
                    const rowText = row.textContent.toLowerCase().trim();
                    if (rowText === '' || rowText.includes('player') || rowText.includes('team') || rowText.includes('rank') || rowText.includes('position')) {
                        return; // Skip this row
                    }
                    
                    const rowData = {
                        rank: '',
                        player_name: '',
                        position: '',
                        team: '',
                        fantasy_points: '',
                        credits: '',
                        plus: '',
                        games_played: '',
                        minutes: '',
                        starter: '',
                        points: '',
                        rebounds: '',
                        assists: '',
                        steals: '',
                        blocks: '',
                        blocks_against: '',
                        field_goals_made: '',
                        field_goals_attempted: '',
                        field_goal_percentage: '',
                        three_point_made: '',
                        three_point_attempted: '',
                        three_point_percentage: '',
                        free_throws_made: '',
                        free_throws_attempted: '',
                        free_throw_percentage: '',
                        offensive_rebounds: '',
                        defensive_rebounds: '',
                        turnovers: '',
                        personal_fouls: '',
                        fouls_drawn: '',
                        plus_minus: ''
                    };
                    
                    // Get all cells in the row
                    const cells = row.querySelectorAll('td');
                    const allStats = Array.from(cells).map(cell => cell.textContent.trim());
                    
                    // Extract data based on the actual table structure
                    // Column order: #, Player, Pos, Team, FPT, CR, PLUS, GP, MIN, ST, PTS, REB, AST, STL, BLK, BA, FGM, FGA, FG%, 3PM, 3PA, 3P%, FTM, FTA, FT%, OREB, DREB, TOV, PF, FD, +/-
                    if (allStats.length > 0) {
                        // Map data by exact column position - shifted one left
                        rowData.rank = (index + 1).toString(); // Use serial number instead of table data
                        rowData.player_name = allStats[0] || ''; // Player name is now in position 0
                        rowData.position = allStats[1] || ''; // Position is now in position 1
                        rowData.team = allStats[2] || ''; // Team is now in position 2
                        rowData.fantasy_points = allStats[3] || ''; // FPT is now in position 3
                        rowData.credits = allStats[4] || ''; // CR is now in position 4
                        rowData.plus = allStats[5] || ''; // PLUS is now in position 5
                        rowData.games_played = allStats[6] || ''; // GP is now in position 6
                        rowData.minutes = allStats[7] || ''; // MIN is now in position 7
                        rowData.starter = allStats[8] || ''; // ST is now in position 8
                        rowData.points = allStats[9] || ''; // PTS is now in position 9
                        rowData.rebounds = allStats[10] || ''; // REB is now in position 10
                        rowData.assists = allStats[11] || ''; // AST is now in position 11
                        rowData.steals = allStats[12] || ''; // STL is now in position 12
                        rowData.blocks = allStats[13] || ''; // BLK is now in position 13
                        rowData.blocks_against = allStats[14] || ''; // BA is now in position 14
                        rowData.field_goals_made = allStats[15] || ''; // FGM is now in position 15
                        rowData.field_goals_attempted = allStats[16] || ''; // FGA is now in position 16
                        rowData.field_goal_percentage = allStats[17] || ''; // FG% is now in position 17
                        rowData.three_point_made = allStats[18] || ''; // 3PM is now in position 18
                        rowData.three_point_attempted = allStats[19] || ''; // 3PA is now in position 19
                        rowData.three_point_percentage = allStats[20] || ''; // 3P% is now in position 20
                        rowData.free_throws_made = allStats[21] || ''; // FTM is now in position 21
                        rowData.free_throws_attempted = allStats[22] || ''; // FTA is now in position 22
                        rowData.free_throw_percentage = allStats[23] || ''; // FT% is now in position 23
                        rowData.offensive_rebounds = allStats[24] || ''; // OREB is now in position 24
                        rowData.defensive_rebounds = allStats[25] || ''; // DREB is now in position 25
                        rowData.turnovers = allStats[26] || ''; // TOV is now in position 26
                        rowData.personal_fouls = allStats[27] || ''; // PF is now in position 27
                        rowData.fouls_drawn = allStats[28] || ''; // FD is now in position 28
                        rowData.plus_minus = allStats[29] || ''; // +/- is now in position 29
                    }
                    
                    // Only add if we have meaningful data
                    if (rowData.player_name && rowData.player_name !== '') {
                    results.push(rowData);
                    }
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
            { id: 'rank', title: '#' },
            { id: 'player_name', title: 'Player' },
            { id: 'position', title: 'Pos' },
            { id: 'team', title: 'Team' },
            { id: 'fantasy_points', title: 'FPT' },
            { id: 'credits', title: 'CR' },
            { id: 'plus', title: 'PLUS' },
            { id: 'games_played', title: 'GP' },
            { id: 'minutes', title: 'MIN' },
            { id: 'starter', title: 'ST' },
            { id: 'points', title: 'PTS' },
            { id: 'rebounds', title: 'REB' },
            { id: 'assists', title: 'AST' },
            { id: 'steals', title: 'STL' },
            { id: 'blocks', title: 'BLK' },
            { id: 'blocks_against', title: 'BA' },
            { id: 'field_goals_made', title: 'FGM' },
            { id: 'field_goals_attempted', title: 'FGA' },
            { id: 'field_goal_percentage', title: 'FG%' },
            { id: 'three_point_made', title: '3PM' },
            { id: 'three_point_attempted', title: '3PA' },
            { id: 'three_point_percentage', title: '3P%' },
            { id: 'free_throws_made', title: 'FTM' },
            { id: 'free_throws_attempted', title: 'FTA' },
            { id: 'free_throw_percentage', title: 'FT%' },
            { id: 'offensive_rebounds', title: 'OREB' },
            { id: 'defensive_rebounds', title: 'DREB' },
            { id: 'turnovers', title: 'TOV' },
            { id: 'personal_fouls', title: 'PF' },
            { id: 'fouls_drawn', title: 'FD' },
            { id: 'plus_minus', title: '+/-' }
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
