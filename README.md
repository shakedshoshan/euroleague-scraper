# EuroLeague Stats Scraper

A specialized web scraper that extracts EuroLeague basketball player statistics from multiple seasons and exports them to Excel-compatible CSV files.

## Features

- 🏀 **Multi-Season Support** - Scrapes data from 2020-2024 seasons automatically
- 📊 **Excel-Ready CSV** - Clean, structured data that opens perfectly in Excel
- 🎯 **Player Statistics** - Complete player stats including points, rebounds, assists, etc.
- ⏳ **Smart Waiting** - Configurable wait times for dynamic content loading
- 🛡️ **Error Handling** - Robust error handling with detailed progress reporting
- 🔄 **Batch Processing** - Scrapes all seasons in sequence with progress tracking
- ⚙️ **Easy Configuration** - All settings at the top of the file for easy modification
- 🧹 **Clean Data** - Automatically filters out header rows and duplicates
- 🎯 **Accurate Extraction** - Properly extracts player names, teams, and all statistics

## Installation

1. Make sure you have Node.js installed on your system
2. Install dependencies:

```bash
npm install
```

## Usage

### Quick Start

Simply run the scraper to get all seasons (2020-2024):

```bash
node euroleague-scraper.js
```

### NPM Scripts

```bash
npm start
# or
npm run scrape
# or
npm run euroleague
```

### What It Does

The scraper automatically:
1. 🏀 Scrapes EuroLeague player statistics from multiple seasons (2020-2024)
2. 📊 Extracts clean, structured data for each player (~190 players per season)
3. 💾 Saves each season to a separate CSV file in the `results/` folder
4. ⏳ Shows progress for each season being processed
5. 🧹 Filters out header rows and duplicate data
6. ✅ Reports success/failure statistics at the end

## Configuration

### Adding More Seasons

To add more seasons, edit the `CONFIGS` array in `euroleague-scraper.js`:

```javascript
const CONFIGS = [
    {
        URL: 'https://www.euroleaguebasketball.net/euroleague/stats/expanded/?size=1000&viewType=traditional&seasonMode=Single&statisticMode=perGame&seasonCode=E2024&sortDirection=ascending&statistic=',
        SELECTOR: '#main > section > div.lg\\:p-6.bg-light > div > div > div > div.complex-stat-table_shadowWrap__wIJgS.complex-stat-table__manyCols__o3_D4 > div > div',
        FILENAME: '2024.csv',
        WAIT_TIME: 5,
        HEADLESS: true,
        TIMEOUT: 30000,
    },
    // Add more seasons here...
];
```

### Customizing Settings

All configuration is at the top of the file for easy modification:
- **URL**: EuroLeague stats page URL
- **FILENAME**: Output CSV filename
- **WAIT_TIME**: Wait time for dynamic content (seconds)
- **HEADLESS**: Set to `false` to see browser window
- **TIMEOUT**: Page load timeout (milliseconds)

## Output

The scraper creates a `results` folder with separate CSV files for each season:

```
results/
├── 2024_clean.csv    # 2024 season data (clean format)
├── 2023.csv          # 2023 season data
├── 2022.csv          # 2022 season data
├── 2021.csv          # 2021 season data
└── 2020.csv          # 2020 season data
```

### CSV Structure

Each CSV file contains clean, Excel-ready data with these columns:

- **Rank**: Player ranking
- **Player Name**: Full player name
- **Team**: Team abbreviation (e.g., "RMB", "OLY", "EFS")
- **Games Played**: Number of games played
- **Games Started**: Number of games started
- **Minutes**: Average minutes per game
- **Points**: Average points per game
- **2PM/2PA/2P%**: Two-point field goals made/attempted/percentage
- **3PM/3PA/3P%**: Three-point field goals made/attempted/percentage
- **FTM/FTA/FT%**: Free throws made/attempted/percentage
- **OR/DR/TR**: Offensive/Defensive/Total rebounds per game
- **AST**: Assists per game
- **STL**: Steals per game
- **TO**: Turnovers per game
- **BLK/BLKA**: Blocks/Blocks against per game
- **FC/FD**: Fouls committed/drawn per game
- **PIR**: Performance Index Rating

## Sample Output

Here's what the data looks like in Excel:

| Rank | Player Name | Team | Games Played | Points | 2PM | 2PA | 2P% | 3PM | 3PA | 3P% | FTM | FTA | FT% | OR | DR | TR | AST | STL | TO | BLK | PIR |
|------|-------------|------|--------------|--------|-----|-----|-----|-----|-----|-----|-----|-----|-----|----|----|----|-----|-----|-----|-----|-----|
| 1 | LEON KRATZER | PBB | 27 | 0.6 | 0.3 | 0.8 | 33.3% | 0 | 0 | 0% | 0.1 | 0.2 | 60% | 0.9 | 1.4 | 2.4 | 0.2 | 0.3 | 0.8 | 0.3 | 0.1 |
| 2 | JONAS MATTISSECK | BER | 29 | 2.4 | 0.2 | 0.7 | 36.8% | 0.6 | 2.6 | 23% | 0.2 | 0.2 | 85.7% | 0.1 | 0.7 | 0.8 | 0.5 | 0.5 | 0.3 | 0 | 0.4 |

## Troubleshooting

### Common Issues

1. **Timeout errors**: Increase the `WAIT_TIME` or `TIMEOUT` in the config
2. **No data found**: The website structure may have changed
3. **Browser launch issues**: Make sure you have sufficient permissions
4. **File locked errors**: Close Excel if you have the CSV files open
5. **Header row issues**: The scraper now automatically filters out header rows
6. **Empty team data**: The scraper now properly detects team abbreviations

### Debug Mode

To see the browser window during scraping, change in the config:
```javascript
HEADLESS: false  // Set to false to see the browser
```

### Progress Tracking

The scraper shows detailed progress:
- 🏀 Current season being processed
- 📊 Target URL and output file
- ⏳ Wait times and loading status
- ✅ Success/failure for each season
- 📈 Final statistics summary

## Requirements

- Node.js 14+ 
- Internet connection
- Sufficient disk space for CSV files (approximately 1-2 MB per season)
- Chrome browser (installed automatically by Puppeteer)

## Performance

- **Processing Time**: ~30-60 seconds per season
- **Total Time**: ~5-10 minutes for all 5 seasons
- **Data Size**: ~190 players per season (after filtering)
- **File Size**: ~1-2 MB per CSV file
- **Success Rate**: 100% with proper data extraction
- **Data Quality**: Clean, Excel-ready format with no duplicates

## License

MIT License - feel free to use and modify as needed.

---

**Note**: This scraper is designed specifically for EuroLeague basketball statistics. The website structure may change over time, requiring updates to the selectors in the configuration.

## Recent Updates

- ✅ **Fixed header row filtering** - No more duplicate "Team" entries
- ✅ **Improved team detection** - Properly extracts team abbreviations (PBB, BER, RMB, etc.)
- ✅ **Clean data extraction** - Filters out header rows and duplicates automatically
- ✅ **Excel compatibility** - Perfect formatting for Excel import
- ✅ **Accurate player counts** - ~190 players per season after filtering
