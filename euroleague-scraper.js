// =============================================================================
// EUROLEAGUE SCRAPER - CONFIGURATION (MODIFY THESE VALUES)
// =============================================================================

// Configuration for scraping by weeks
const BASE_URL = 'https://www.dunkest.com/en/euroleague/stats/players/table/season/2024-2025?season_id=17&mode=dunkest&stats_type=tot&weeks[]={WEEK}&rounds[]=1&rounds[]=2&teams[]=31&teams[]=32&teams[]=33&teams[]=34&teams[]=35&teams[]=36&teams[]=37&teams[]=38&teams[]=39&teams[]=40&teams[]=41&teams[]=42&teams[]=43&teams[]=44&teams[]=45&teams[]=47&teams[]=48&teams[]=60&positions[]=1&positions[]=2&positions[]=3&player_search=&min_cr=4&max_cr=35&sort_by=pdk&sort_order=desc&iframe=yes&noadv=yes';

const CONFIGS = {
    // CSS selector for the data table
    SELECTOR: 'body > main > div.mt-4.table-stats__container > table',
    
    // Year for folder organization
    YEAR: '2024-2025',
    
    // Wait time in seconds (for dynamic content to load)
    WAIT_TIME: 5,
    
    // Browser settings
    HEADLESS: true, // Set to false to see the browser window
    TIMEOUT: 30000, // Page load timeout in milliseconds
    
    // Week range to scrape for 2024-2025 season (43 weeks available)
    WEEKS: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43]
};

// =============================================================================
// SCRAPER CODE (DO NOT MODIFY BELOW THIS LINE)
// =============================================================================

const puppeteer = require('puppeteer');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const fs = require('fs');
const path = require('path');

class EuroLeagueScraper {
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

            console.log('🔍 Extracting data from all pages...');
            const allData = [];
            const seenPlayers = new Set(); // Track unique players to avoid duplicates
            let currentPage = 1;
            let hasNextPage = true;
            const maxPages = 20; // Reduced limit since there should be ~15 pages for 222 players

            while (hasNextPage && currentPage <= maxPages) {
                console.log(`📄 Scraping page ${currentPage}...`);
                
                const pageData = await this.page.evaluate(() => {
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
                
                // Filter out duplicate players
                const newPlayers = [];
                let duplicateCount = 0;
                
                for (const player of pageData) {
                    const playerKey = `${player.player_name}_${player.team}`.toLowerCase();
                    if (!seenPlayers.has(playerKey)) {
                        seenPlayers.add(playerKey);
                        newPlayers.push(player);
                    } else {
                        duplicateCount++;
                    }
                }
                
                // Add only new players to all data
                allData.push(...newPlayers);
                console.log(`✅ Found ${pageData.length} records on page ${currentPage} (${newPlayers.length} new, ${duplicateCount} duplicates)`);
                
                // If no new data found on this page, break the loop
                if (newPlayers.length === 0) {
                    console.log('⚠️  No new players found on this page, stopping pagination');
                    break;
                }
                
                // If we found duplicates, we might be cycling - check if we should stop
                if (duplicateCount > 0 && duplicateCount === pageData.length) {
                    console.log('⚠️  All players on this page are duplicates, stopping pagination');
                    break;
                }
                
                // If we have fewer than 15 players on this page, we might be on the last page
                if (pageData.length < 15) {
                    console.log(`📄 Page ${currentPage} has only ${pageData.length} players - likely the last page`);
                }
                
                // Don't stop based on player count - let pagination detection handle it
                // The pagination will stop when there's no next page available
                
                // Debug: Check what pagination elements are available
                const paginationInfo = await this.page.evaluate(() => {
                    const paginationElements = {
                        nextButtons: document.querySelectorAll('button[aria-label="Next page"], .pagination-next, .next-page, [data-testid="next-page"]'),
                        paginationNext: document.querySelectorAll('.pagination .next:not(.disabled), .pagination .next:not([disabled])'),
                        arrowRight: document.querySelectorAll('.fa-chevron-right, .fa-arrow-right, .arrow-right'),
                        nextLinks: document.querySelectorAll('a[aria-label="Next"], a.next, .pagination a:last-child'),
                        allButtons: document.querySelectorAll('button'),
                        allLinks: document.querySelectorAll('a'),
                        paginationContainer: document.querySelectorAll('.pagination, .pager, .page-nav')
                    };
                    
                    return {
                        nextButtonCount: paginationElements.nextButtons.length,
                        paginationNextCount: paginationElements.paginationNext.length,
                        arrowRightCount: paginationElements.arrowRight.length,
                        nextLinkCount: paginationElements.nextLinks.length,
                        totalButtons: paginationElements.allButtons.length,
                        totalLinks: paginationElements.allLinks.length,
                        paginationContainerCount: paginationElements.paginationContainer.length,
                        buttonTexts: Array.from(paginationElements.allButtons).map(b => b.textContent.trim()).filter(t => t.length > 0),
                        linkTexts: Array.from(paginationElements.allLinks).map(a => a.textContent.trim()).filter(t => t.length > 0)
                    };
                });
                
                console.log('🔍 Pagination debug info:', paginationInfo);
                
                // Check if there's a next page
                hasNextPage = await this.page.evaluate(() => {
                    // Look for pagination elements based on the debug info
                    const allLinks = document.querySelectorAll('a');
                    let nextPageLink = null;
                    
                    // Look for the '»' symbol or next page indicators
                    for (let link of allLinks) {
                        const text = link.textContent.trim();
                        if (text === '»' || text === '>' || text === 'Next' || text === 'Next page') {
                            // Check if it's not disabled
                            if (!link.classList.contains('disabled') && link.style.display !== 'none') {
                                nextPageLink = link;
                                break;
                            }
                        }
                    }
                    
                    // Also check for numbered pagination (if we see numbers like 1, 2, 3, ..., 15)
                    const numberedLinks = Array.from(allLinks).filter(link => {
                        const text = link.textContent.trim();
                        return /^\d+$/.test(text) || text === '...';
                    });
                    
                    // If we have numbered pagination, check if there's a next page
                    if (numberedLinks.length > 0) {
                        const numbers = numberedLinks.map(link => link.textContent.trim()).filter(text => /^\d+$/.test(text));
                        const maxPage = Math.max(...numbers.map(n => parseInt(n)));
                        
                        // Find the current page
                        const currentPageLink = numberedLinks.find(link => 
                            link.classList.contains('active') || 
                            link.classList.contains('current') ||
                            link.getAttribute('aria-current') === 'page'
                        );
                        
                        let currentPage = 1;
                        if (currentPageLink) {
                            currentPage = parseInt(currentPageLink.textContent.trim());
                        }
                        
                        // If we're not on the last page, there should be a next page
                        if (currentPage < maxPage) {
                            return true;
                        } else {
                            // We're on the last page, no next page
                            return false;
                        }
                    }
                    
                    return nextPageLink !== null;
                });
                
                if (hasNextPage) {
                    // Try to click next page button
                    const nextClicked = await this.page.evaluate(() => {
                        const allLinks = document.querySelectorAll('a');
                        
                        // Look for the '»' symbol or next page indicators
                        for (let link of allLinks) {
                            const text = link.textContent.trim();
                            if (text === '»' || text === '>' || text === 'Next' || text === 'Next page') {
                                // Check if it's not disabled
                                if (!link.classList.contains('disabled') && link.style.display !== 'none') {
                                    link.click();
                                    return true;
                                }
                            }
                        }
                        
                        // If no direct next button, try clicking the next numbered page
                        const numberedLinks = Array.from(allLinks).filter(link => {
                            const text = link.textContent.trim();
                            return /^\d+$/.test(text);
                        });
                        
                        if (numberedLinks.length > 0) {
                            // Find the current page and click the next one
                            // Look for the active/current page indicator
                            let currentPageNumber = 1;
                            const activePageLink = numberedLinks.find(link => 
                                link.classList.contains('active') || 
                                link.classList.contains('current') ||
                                link.getAttribute('aria-current') === 'page'
                            );
                            
                            if (activePageLink) {
                                currentPageNumber = parseInt(activePageLink.textContent.trim());
                            }
                            
                            const nextPageNumber = currentPageNumber + 1;
                            const nextPageLink = numberedLinks.find(link => 
                                link.textContent.trim() === nextPageNumber.toString()
                            );
                            
                            if (nextPageLink) {
                                nextPageLink.click();
                                return true;
                            }
                        }
                        
                        return false;
                    });
                    
                    if (nextClicked) {
                        // Wait for new content to load
                        await this.page.waitForTimeout(2000);
                        currentPage++;
                    } else {
                        // If no next button found, try scrolling to load more content
                        await this.page.evaluate(() => {
                            window.scrollTo(0, document.body.scrollHeight);
                        });
                        await this.page.waitForTimeout(2000);
                        
                        // Check if new content loaded
                        const newRowCount = await this.page.evaluate(() => {
                            const rows = document.querySelectorAll('tbody tr, tr');
                            return rows.length;
                        });
                        
                        if (newRowCount > allData.length) {
                            currentPage++;
                        } else {
                            hasNextPage = false;
                        }
                    }
                } else {
                    console.log('⚠️  No next page button found, stopping pagination');
                    hasNextPage = false;
                }
            }
            
            if (currentPage > maxPages) {
                console.log(`⚠️  Reached maximum page limit (${maxPages}), stopping pagination`);
            }

            console.log(`✅ Found ${allData.length} total player records across ${currentPage} pages`);
            return allData;

        } catch (error) {
            console.error('❌ Error during scraping:', error.message);
            throw error;
        }
    }

    async exportToCSV(data, filePath) {
        const headers = [
            { id: 'rank', title: 'Rank' },
            { id: 'player_name', title: 'Player Name' },
            { id: 'team', title: 'Team' },
            { id: 'position', title: 'Position' },
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

    async scrapeWeek(week) {
        try {
            const url = BASE_URL.replace('{WEEK}', week);
            console.log(`📡 Navigating to Week ${week}: ${url}`);
            await this.page.goto(url, { 
                waitUntil: 'networkidle2',
                timeout: this.configs.TIMEOUT 
            });

            console.log(`⏳ Waiting ${this.configs.WAIT_TIME} seconds for content to load...`);
            await this.page.waitForTimeout(this.configs.WAIT_TIME * 1000);

            console.log(`🔍 Extracting data from all pages for Week ${week}...`);
            const allData = [];
            const seenPlayers = new Set();
            let currentPage = 1;
            let hasNextPage = true;
            const maxPages = 20;

            while (hasNextPage && currentPage <= maxPages) {
                console.log(`📄 Scraping Week ${week}, page ${currentPage}...`);
                
                const pageData = await this.page.evaluate(() => {
                    const results = [];
                    const table = document.querySelector('body > main > div.mt-4.table-stats__container > table');
                    if (!table) {
                        console.log('Table not found with selector');
                        return results;
                    }
                    const rows = table.querySelectorAll('tbody tr');
                    rows.forEach((row, index) => {
                        const rowData = {
                            rank: '',
                            player_name: '',
                            team: '',
                            position: '',
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
                        
                        const cells = row.querySelectorAll('td');
                        const allStats = Array.from(cells).map(cell => cell.textContent.trim());
                        
                        if (allStats.length > 0) {
                            rowData.rank = (index + 1).toString();
                            rowData.player_name = allStats[0] || '';
                            rowData.position = allStats[1] || '';
                            rowData.team = allStats[2] || '';
                            rowData.fantasy_points = allStats[3] || '';
                            rowData.credits = allStats[4] || '';
                            rowData.plus = allStats[5] || '';
                            rowData.games_played = allStats[6] || '';
                            rowData.minutes = allStats[7] || '';
                            rowData.starter = allStats[8] || '';
                            rowData.points = allStats[9] || '';
                            rowData.rebounds = allStats[10] || '';
                            rowData.assists = allStats[11] || '';
                            rowData.steals = allStats[12] || '';
                            rowData.blocks = allStats[13] || '';
                            rowData.blocks_against = allStats[14] || '';
                            rowData.field_goals_made = allStats[15] || '';
                            rowData.field_goals_attempted = allStats[16] || '';
                            rowData.field_goal_percentage = allStats[17] || '';
                            rowData.three_point_made = allStats[18] || '';
                            rowData.three_point_attempted = allStats[19] || '';
                            rowData.three_point_percentage = allStats[20] || '';
                            rowData.free_throws_made = allStats[21] || '';
                            rowData.free_throws_attempted = allStats[22] || '';
                            rowData.free_throw_percentage = allStats[23] || '';
                            rowData.offensive_rebounds = allStats[24] || '';
                            rowData.defensive_rebounds = allStats[25] || '';
                            rowData.turnovers = allStats[26] || '';
                            rowData.personal_fouls = allStats[27] || '';
                            rowData.fouls_drawn = allStats[28] || '';
                            rowData.plus_minus = allStats[29] || '';
                        }
                        
                        results.push(rowData);
                    });
                    
                    return results;
                });
                
                const newPlayers = [];
                let duplicateCount = 0;
                
                for (const player of pageData) {
                    const playerKey = `${player.player_name}_${player.team}`.toLowerCase();
                    if (!seenPlayers.has(playerKey)) {
                        seenPlayers.add(playerKey);
                        newPlayers.push(player);
                    } else {
                        duplicateCount++;
                    }
                }
                
                allData.push(...newPlayers);
                console.log(`✅ Found ${pageData.length} records on Week ${week}, page ${currentPage} (${newPlayers.length} new, ${duplicateCount} duplicates)`);
                
                if (newPlayers.length === 0) {
                    console.log('⚠️  No new players found on this page, stopping pagination');
                    break;
                }
                
                if (duplicateCount > 0 && duplicateCount === pageData.length) {
                    console.log('⚠️  All players on this page are duplicates, stopping pagination');
                    break;
                }
                
                if (pageData.length < 15) {
                    console.log(`📄 Week ${week}, Page ${currentPage} has only ${pageData.length} players - likely the last page`);
                }
                
                hasNextPage = await this.page.evaluate(() => {
                    const allLinks = document.querySelectorAll('a');
                    let nextPageLink = null;
                    
                    for (let link of allLinks) {
                        const text = link.textContent.trim();
                        if (text === '»' || text === '>' || text === 'Next' || text === 'Next page') {
                            if (!link.classList.contains('disabled') && link.style.display !== 'none') {
                                nextPageLink = link;
                                break;
                            }
                        }
                    }
                    
                    const numberedLinks = Array.from(allLinks).filter(link => {
                        const text = link.textContent.trim();
                        return /^\d+$/.test(text) || text === '...';
                    });
                    
                    if (numberedLinks.length > 0) {
                        const numbers = numberedLinks.map(link => link.textContent.trim()).filter(text => /^\d+$/.test(text));
                        const maxPage = Math.max(...numbers.map(n => parseInt(n)));
                        
                        const currentPageLink = numberedLinks.find(link => 
                            link.classList.contains('active') || 
                            link.classList.contains('current') ||
                            link.getAttribute('aria-current') === 'page'
                        );
                        
                        let currentPage = 1;
                        if (currentPageLink) {
                            currentPage = parseInt(currentPageLink.textContent.trim());
                        }
                        
                        if (currentPage < maxPage) {
                            return true;
                        } else {
                            return false;
                        }
                    }
                    
                    return nextPageLink !== null;
                });
                
                if (hasNextPage) {
                    const nextClicked = await this.page.evaluate(() => {
                        const allLinks = document.querySelectorAll('a');
                        
                        for (let link of allLinks) {
                            const text = link.textContent.trim();
                            if (text === '»' || text === '>' || text === 'Next' || text === 'Next page') {
                                if (!link.classList.contains('disabled') && link.style.display !== 'none') {
                                    link.click();
                                    return true;
                                }
                            }
                        }
                        
                        const numberedLinks = Array.from(allLinks).filter(link => {
                            const text = link.textContent.trim();
                            return /^\d+$/.test(text);
                        });
                        
                        if (numberedLinks.length > 0) {
                            let currentPageNumber = 1;
                            const activePageLink = numberedLinks.find(link => 
                                link.classList.contains('active') || 
                                link.classList.contains('current') ||
                                link.getAttribute('aria-current') === 'page'
                            );
                            
                            if (activePageLink) {
                                currentPageNumber = parseInt(activePageLink.textContent.trim());
                            }
                            
                            const nextPageNumber = currentPageNumber + 1;
                            const nextPageLink = numberedLinks.find(link => 
                                link.textContent.trim() === nextPageNumber.toString()
                            );
                            
                            if (nextPageLink) {
                                nextPageLink.click();
                                return true;
                            }
                        }
                        
                        return false;
                    });
                    
                    if (nextClicked) {
                        await this.page.waitForTimeout(2000);
                        currentPage++;
                    } else {
                        console.log('⚠️  No next page button found, stopping pagination');
                        hasNextPage = false;
                    }
                } else {
                    console.log('⚠️  No next page button found, stopping pagination');
                    hasNextPage = false;
                }
            }
            
            console.log(`✅ Found ${allData.length} total player records for Week ${week} across ${currentPage} pages`);
            return allData;
        } catch (error) {
            console.error(`❌ Error during scraping Week ${week}:`, error.message);
            throw error;
        }
    }

    async scrapeAllWeeks() {
        try {
            console.log(`🏀 Starting EuroLeague Week-by-Week Scraper for ${this.configs.YEAR} season...`);
            console.log(`📊 Total weeks to scrape: ${this.configs.WEEKS.length}`);
            console.log('════════════════════════════════════════════════════════════');
            
            // Create year folder
            const yearFolder = path.join('results', this.configs.YEAR);
            if (!fs.existsSync(yearFolder)) {
                fs.mkdirSync(yearFolder, { recursive: true });
                console.log(`📁 Created folder: ${yearFolder}`);
            }
            
            let successfulWeeks = 0;
            let failedWeeks = 0;
            
            for (let i = 0; i < this.configs.WEEKS.length; i++) {
                const week = this.configs.WEEKS[i];
                console.log(`\n🏀 Scraping Week ${week}/${this.configs.WEEKS.length}`);
                console.log('────────────────────────────────────────────────────────────');
                
                try {
                    // Check if browser is still connected
                    if (!this.browser || !this.page) {
                        console.log('🔄 Browser disconnected, reconnecting...');
                        await this.init();
                    }
                    
                    const weekData = await this.scrapeWeek(week);
                    
                    if (weekData.length > 0) {
                        // Create CSV file for this week
                        const filename = `week_${week.toString().padStart(2, '0')}.csv`;
                        const filepath = path.join(yearFolder, filename);
                        
                        await this.exportToCSV(weekData, filepath);
                        console.log(`💾 Week ${week} data exported to: ${filepath}`);
                        successfulWeeks++;
                    } else {
                        console.log(`⚠️  No data found for Week ${week}, skipping...`);
                    }
                } catch (error) {
                    console.error(`❌ Week ${week} failed:`, error.message);
                    failedWeeks++;
                    
                    // Try to reconnect browser if it's a connection error
                    if (error.message.includes('Target closed') || error.message.includes('Protocol error')) {
                        try {
                            console.log('🔄 Attempting to reconnect browser...');
                            await this.close();
                            await this.init();
                        } catch (reconnectError) {
                            console.error('❌ Failed to reconnect browser:', reconnectError.message);
                        }
                    }
                }
                
                // Small delay between weeks
                if (i < this.configs.WEEKS.length - 1) {
                    await this.page.waitForTimeout(1000);
                }
            }
            
            console.log('\n════════════════════════════════════════════════════════════');
            console.log('🎉 All weeks scraping completed!');
            console.log(`✅ Successful: ${successfulWeeks}/${this.configs.WEEKS.length} weeks`);
            console.log(`❌ Failed: ${failedWeeks}/${this.configs.WEEKS.length} weeks`);
            
        } catch (error) {
            console.error('❌ Error during week-by-week scraping:', error.message);
            throw error;
        }
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
    const scraper = new EuroLeagueScraper(CONFIGS);
    
    try {
        await scraper.init();
        await scraper.scrapeAllWeeks();
    } catch (error) {
        console.error('💥 Scraping failed:', error.message);
        process.exit(1);
    } finally {
        await scraper.close();
    }
}

// Run the scraper
main();
