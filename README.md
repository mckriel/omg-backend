# World of Warcraft Guild API

A comprehensive REST API for tracking World of Warcraft guild data including raid progress, Mythic+ scores, PvP ratings, and member statistics across multiple seasons. Created by Scott Jones (Holybarry-sylvanas) of scottjones.nl.

## License

This project is licensed under the Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International License (CC BY-NC-ND 4.0).

You are free to use and adapt the code for personal and non-commercial purposes, but you may not redistribute, sublicense, or use it for commercial purposes. No derivative works or modifications may be distributed.

See [LICENSE](https://creativecommons.org/licenses/by-nc-nd/4.0/) for full details.

## Features

- **Real-time Guild Data** - Automated sync with Battle.net API every 30 minutes
- **Multi-Season Tracking** - Complete raid progress history for The War Within expansion
- **Performance Optimized** - MongoDB caching for sub-second API responses
- **Comprehensive Analytics** - Individual member and guild-wide statistics
- **WebSocket Support** - Real-time updates during data synchronization

## Requirements

### Core Requirements

- **Node.js**: Version 20 or higher is required. [Download Node.js](https://nodejs.org/en/download/)
- **npm** or **Yarn**: Comes with Node.js, but you can also [install Yarn](https://classic.yarnpkg.com/en/docs/install/) if preferred.
- **MongoDB**: You need access to a MongoDB instance (local or cloud). [Install MongoDB locally](https://www.mongodb.com/try/download/community) or use [MongoDB Atlas (cloud)](https://www.mongodb.com/cloud/atlas).

## Quick Start

### Installation
```bash
npm install
# or
yarn install

cp .env_example .env
# Configure your environment variables in .env
npm start
```

### Environment Variables (.env)
```env
MONGODB=mongodb://username:password@host:port/database
DATABASE_NAME=omg
MEMBERS_COLLECTION_NAME=members
SIGNUP_COLLECTION=season3_signup
PORT=8000
HOST=0.0.0.0
API_BATTLENET_KEY=your_battlenet_key
API_BATTLENET_SECRET=your_battlenet_secret
GUILD_NAME=one-more-game
GUILD_REALM=sylvanas
REGION=eu
API_PARAM_REQUIREMENTGS=namespace=profile-eu&locale=en_US
```

## Configuration

### Guild Settings (`app.config.json`)
```json
{
  "API_BATTLENET_KEY": "your_key",
  "API_BATTLENET_SECRET": "your_secret",
  "GUILD_NAME": "one-more-game",
  "GUILD_REALM": "sylvanas", 
  "REGION": "eu",
  "LEVEL_REQUIREMENT": 80,
  "ITEM_LEVEL_REQUIREMENT": 440,
  "SEASON3_TIER_SETS": [
    "Deathbringer", "Rider of the Apocalypse", "San'layn",
    "Aldrachi Reaver", "Fel-Scarred", 
    "Druid of the Claw", "Elune's Chosen", "Keeper of the Grove", "Wildstalker",
    "Chronowarden", "Flameshaper", "Scalecommander",
    "Dark Ranger", "Pack Leader", "Sentinel",
    "Frostfire", "Spellslinger", "Sunfury",
    "Conduit of the Celestials", "Master of Harmony", "Shado-Pan",
    "Herald of the Sun", "Lightsmith", "Templar",
    "Archon", "Oracle", "Voidweaver",
    "Deathstalker", "Fatebound", "Trickster",
    "Farseer", "Stormbringer", "Totemic",
    "Diabolist", "Hellcaller", "Soul Harvester",
    "Colossus", "Mountain Thane", "Slayer"
  ]
}
```

## API Endpoints

### Guild Member Data

#### `GET /data`
Returns all active guild members with complete character information.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "name": "shadowvirus",
      "server": "sylvanas",
      "class": "Warlock",
      "spec": "Demonology",
      "itemLevel": 635,
      "guildRank": 2,
      "mplus": 3042,
      "pvp": 2016,
      "ready": true,
      "missingEnchants": [],
      "hasTierSet": true,
      "isActiveInSeason3": true,
      "lockStatus": {
        "isLocked": true,
        "lockedTo": {
          "Heroic": { "completed": 6, "total": 8 }
        }
      }
    }
  ],
  "statistics": {
    "totalMembers": 45,
    "missingEnchants": 5,
    "raidLocked": 12,
    "avgTopMplus": 2850,
    "avgTopPvp": 1750,
    "roleCounts": { "tanks": 4, "healers": 8, "dps": 33 }
  },
  "timestamp": "2025-01-12T10:30:00Z"
}
```

#### `GET /data/filtered`
Returns filtered guild member data with query parameters.

**Query Parameters:**
- `search` - Filter by character name
- `rankFilter` - Filter by guild rank (`all`, `mains`, `alts`)
- `classFilter` - Filter by character class
- `specFilter` - Filter by specialization (`all`, `tanks`, `healers`, `dps`)
- `minItemLevel` - Minimum item level filter
- `filter` - Special filters (`missing-enchants`, `locked-normal`, `has-pvp-rating`, etc.)
- `page`, `limit` - Pagination parameters

---

### Guild Raid Progress (NEW)

#### `GET /guild-progress`
**Home page summary** - Current season raid progress (Heroic + Mythic focus).

**Response:**
```json
{
  "success": true,
  "data": {
    "currentSeason": "Season 2",
    "totalMembers": 45,
    "raids": [
      {
        "name": "Liberation of Undermine",
        "heroicProgress": {
          "completed": 15,
          "total": 45,
          "percentage": 33
        },
        "mythicProgress": {
          "completed": 5,
          "total": 45,
          "percentage": 11
        }
      }
    ]
  },
  "timestamp": "2025-01-12T10:30:00Z"
}
```

#### `GET /guild-progress/all-seasons`
Comprehensive guild progress for all War Within seasons (cached).

**Query Parameters:**
- `force=true` - Force live calculation instead of cached data

**Response:**
```json
{
  "success": true,
  "data": {
    "totalMembers": 45,
    "lastUpdated": "2025-01-12T10:30:00Z",
    "cached": true,
    "cacheAge": [
      { "seasonId": "season-1", "lastUpdated": "2025-01-12T09:15:00Z" },
      { "seasonId": "season-2", "lastUpdated": "2025-01-12T10:30:00Z" }
    ],
    "seasons": {
      "season-1": {
        "id": "season-1",
        "name": "Season 1",
        "startDate": "2024-08-26",
        "endDate": "2025-01-07",
        "raids": [
          {
            "raidName": "Nerub-ar Palace",
            "totalMembers": 45,
            "membersWithProgress": 38,
            "memberBreakdown": {
              "mains": { "total": 30, "withProgress": 28 },
              "alts": { "total": 15, "withProgress": 10 }
            },
            "difficulties": {
              "LFR": {
                "membersCompleted": 35,
                "membersWithProgress": 38,
                "averageProgress": 95,
                "bossKills": {
                  "Ulgrax the Devourer": 38,
                  "The Bloodbound Horror": 35,
                  "Sikran, Captain of the Sureki": 32,
                  "Rasha'nan": 28,
                  "Broodtwister Ovi'nax": 25,
                  "Nexus-Princess Ky'veza": 20,
                  "The Silken Court": 18,
                  "Queen Ansurek": 15
                },
                "topProgressors": [
                  {
                    "name": "shadowvirus",
                    "server": "sylvanas",
                    "completed": 8,
                    "total": 8,
                    "percentage": 100,
                    "guildRank": "Officer Alt",
                    "class": "Warlock",
                    "spec": "Demonology"
                  }
                ]
              },
              "Normal": { "..." },
              "Heroic": { "..." },
              "Mythic": { "..." }
            }
          }
        ]
      },
      "season-2": {
        "id": "season-2",
        "name": "Season 2", 
        "startDate": "2025-01-07",
        "endDate": null,
        "raids": [
          {
            "raidName": "Liberation of Undermine",
            "difficulties": {
              "LFR": { "..." },
              "Normal": { "..." },
              "Heroic": { "..." },
              "Mythic": { "..." }
            }
          }
        ]
      }
    }
  },
  "timestamp": "2025-01-12T10:30:00Z"
}
```

#### `GET /guild-progress/season/{seasonId}`
Season-specific guild raid progress (cached).

**Parameters:**
- `seasonId` - Season identifier (`season-1`, `season-2`)

**Query Parameters:**
- `force=true` - Force live calculation instead of cached data

#### `GET /guild-progress/current`
Current season guild raid progress (uses cached data).

#### `GET /guild-progress/seasons`
List of available seasons and their configuration.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "season-1",
      "name": "Season 1", 
      "startDate": "2024-08-26",
      "endDate": "2025-01-07",
      "raids": [
        {
          "id": "nerubar-palace",
          "name": "Nerub-ar Palace",
          "bossCount": 8
        }
      ]
    },
    {
      "id": "season-2",
      "name": "Season 2",
      "startDate": "2025-01-07", 
      "endDate": null,
      "raids": [
        {
          "id": "liberation-of-undermine",
          "name": "Liberation of Undermine", 
          "bossCount": 8
        }
      ]
    }
  ],
  "timestamp": "2025-01-12T10:30:00Z"
}
```

---

### Statistics Endpoints

#### `GET /stats/top-pve`
Top 5 Mythic+ players in the guild.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "name": "shadowvirus",
      "score": 3042,
      "class": "Warlock",
      "spec": "Demonology",
      "server": "sylvanas",
      "itemLevel": 635,
      "guildRank": 2,
      "media": { "avatar_url": "..." }
    }
  ],
  "timestamp": "2025-01-12T10:30:00Z"
}
```

#### `GET /stats/top-pvp`
Top 5 PvP players in the guild.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "name": "shadowvirus",
      "rating": 2016,
      "class": "Warlock",
      "spec": "Demonology",
      "server": "sylvanas",
      "itemLevel": 635,
      "guildRank": 2,
      "media": { "avatar_url": "..." }
    }
  ],
  "timestamp": "2025-01-12T10:30:00Z"
}
```

#### `GET /stats/role-counts`
Guild member distribution by role (tank, healer, DPS).

#### `GET /stats/missing-enchants`
Members missing required enchantments.

---

### Data Management

#### `POST /update`
Manually trigger guild data synchronization.

**Body (optional):**
```json
{
  "dataTypes": ["raid", "mplus", "pvp"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Guild update process started",
  "processId": "1736690123456",
  "dataTypes": ["raid", "mplus", "pvp"]
}
```

#### `GET /status`
Current data status and last update information.

#### `GET /health`
API health check endpoint.

---

### Legacy Season 3 Endpoints

#### `GET /api/season3/data`
Season 3 character data.

#### `POST /api/season3/signup`
Season 3 signup submission.

---

## MongoDB Schema

### Collections Overview

The API uses three main MongoDB collections:

#### **members** Collection
Stores individual guild member data with comprehensive character information.

```javascript
{
  _id: ObjectId,
  name: "shadowvirus",
  server: "sylvanas",
  itemlevel: {
    equiped: 635,
    average: 632
  },
  metaData: {
    class: "Warlock",
    spec: "Demonology", 
    lastUpdated: "2025-01-12T08:15:23.000Z",
    role: "dps"
  },
  guildData: {
    rank: 2  // Index into GUILLD_RANKS array
  },
  equipement: [
    {
      type: "HEAD",
      name: "Obsidian Crown of Dominance",
      needsEnchant: false,
      hasEnchant: false,
      isTierItem: true,
      level: 639,
      _raw: { /* Full Battle.net API response */ }
    }
  ],
  raidHistory: {
    currentSeason: {
      instances: [
        {
          instance: { name: "Liberation of Undermine" },
          modes: [
            {
              difficulty: { name: "Mythic" },
              progress: {
                completed_count: 3,
                total_count: 8,
                encounters: [
                  {
                    encounter: { name: "Ksvir the Forgotten" },
                    last_kill_timestamp: "2025-01-10T20:30:00Z"
                  }
                ]
              }
            }
          ]
        }
      ]
    },
    allExpansions: [ /* All expansion raid data from Battle.net */ ]
  },
  mplus: {
    current_mythic_rating: { rating: 3042 },
    /* Additional M+ data from Battle.net */
  },
  pvp: {
    rating: 2016,  // Highest rating across all brackets
    summary: { honor_level: 150 },
    /* Bracket-specific PvP data */
  },
  ready: true,
  missingEnchants: 0,
  hasTierSet: true,
  lockStatus: {
    isLocked: true,
    lockedTo: {
      "Heroic": {
        completed: 6,
        total: 8,
        lastKill: "2025-01-10T20:30:00Z",
        encounters: ["Ksvir the Forgotten", "Cogwork Demolisher"]
      }
    }
  },
  isActiveInSeason3: true,
  processedStats: {
    mythicPlusScore: 3042,
    pvpRating: 2016,
    itemLevel: 635,
    role: "DPS",
    spec: "Demonology",
    class: "Warlock"
  },
  media: {
    avatar_url: "https://render.worldofwarcraft.com/...",
    /* Additional media URLs from Battle.net */
  },
  lastUpdated: ISODate("2025-01-12T10:30:00Z"),
  isActive: true,
  createdAt: ISODate("2024-08-26T15:22:11Z")
}
```

#### **raid_progress** Collection
Cached guild-wide raid progress data organized by season for optimal API performance.

```javascript
{
  _id: ObjectId,
  seasonId: "season-2",
  seasonName: "Season 2",
  lastUpdated: ISODate("2025-01-12T10:30:00Z"),
  totalMembers: 45,
  raids: [
    {
      raidName: "Liberation of Undermine",
      totalMembers: 45,
      membersWithProgress: 38,
      memberBreakdown: {
        mains: { total: 30, withProgress: 28 },
        alts: { total: 15, withProgress: 10 }
      },
      difficulties: {
        "LFR": {
          membersCompleted: 35,      // Members who cleared all bosses
          membersWithProgress: 38,   // Members with any progress
          averageProgress: 95,       // Average completion percentage
          bossKills: {
            "Ksvir the Forgotten": 38,
            "Cogwork Demolisher": 35,
            "Kx'tal the Mournful": 32,
            "Koranos the Relentless": 28,
            "Zeroketh the Infernal": 25,
            "Skaadi the Ruthless": 20,
            "Vexamus the Destroyer": 18,
            "Anub'azal the Traitor": 15
          },
          topProgressors: [
            {
              name: "shadowvirus",
              server: "sylvanas", 
              completed: 8,
              total: 8,
              percentage: 100,
              guildRank: "Officer Alt",
              class: "Warlock",
              spec: "Demonology"
            }
          ]
        },
        "Normal": { /* Same structure as LFR */ },
        "Heroic": { /* Same structure as LFR */ },
        "Mythic": { /* Same structure as LFR */ }
      }
    }
  ],
  metadata: {
    generatedAt: ISODate("2025-01-12T10:30:00Z"),
    memberCount: 45,
    processedRaids: 1
  }
}
```

#### **season3_signup** Collection (Legacy)
Season 3 signup and character data storage.

```javascript
{
  _id: ObjectId,
  timestamp: ISODate("2025-01-12T10:30:00Z"),
  type: "signup" | "character_data",
  /* Signup or character data fields */
}
```

## Data Processing Flow

### Automatic Updates (Every 30 minutes)
1. **Guild Roster Fetch** - Battle.net API call for guild members
2. **Character Data Processing** - Individual character data for each member
3. **Database Updates** - Save/update member records in MongoDB
4. **Raid Progress Calculation** - Aggregate guild-wide progress statistics
5. **Cache Storage** - Save calculated progress to `raid_progress` collection
6. **Cleanup** - Mark inactive members, remove outdated data

### Manual Update Trigger
```bash
# Trigger immediate update
curl -X POST http://localhost:8000/update
```

### API Response Strategy
- **Cached Data First** - All raid progress endpoints use cached MongoDB data
- **Fallback to Live** - If cache missing, calculate live from member data
- **Force Refresh** - Use `?force=true` to bypass cache
- **Performance** - Cached responses: ~50ms, Live calculation: ~2-5 seconds

## Testing

Run the comprehensive test suite:
```bash
node test-raid-progress.js
```

**Test Coverage:**
- ✅ Season configuration validation
- ✅ Database connectivity and member count
- ✅ Raid progress caching functionality  
- ✅ API service functions (cached vs live)
- ✅ Mock data creation and retrieval

## Data Sources & Accuracy

- **Battle.net API** - Official Blizzard character and guild data
- **Mythic+ Scores** - Official WoW rating system (not Raider.io)
- **PvP Ratings** - Highest rating across all PvP brackets
- **Raid Progress** - Individual encounter completion tracking
- **Season Detection** - Automatic season 2 activity detection (characters active since Jan 7, 2025)

## Performance Features

- **MongoDB Caching** - Sub-second API responses for raid progress
- **Automatic Updates** - Cron job runs every 30 minutes
- **Smart Fallbacks** - Live calculation when cache unavailable
- **WebSocket Support** - Real-time progress updates during sync
- **Query Optimization** - Indexed MongoDB queries for fast filtering

## WebSocket Events

Connect to receive real-time updates during guild data synchronization:

```javascript
const socket = io('http://localhost:8000');

socket.on('guild-update-progress', (data) => {
  console.log('Progress:', data.data.message);
  // Event types: start, auth, guild-fetch, member-processing, 
  // raid-progress, cleanup, complete, error
});
```

## Production Deployment

### Using PM2 (Recommended)
```bash
npm install -g pm2
pm2 start src/index.js --name "wow-guild-api"
pm2 startup
pm2 save
```

### Environment Setup
- Use production MongoDB instance (Atlas recommended)
- Set secure environment variables
- Configure reverse proxy (nginx) for HTTPS
- Monitor logs and performance

## Troubleshooting

### Common Issues
1. **Database Connection** - Verify MongoDB URI and credentials
2. **Battle.net API** - Check API key/secret and rate limits
3. **Missing Data** - Ensure guild name/realm are correct
4. **Cache Issues** - Use `?force=true` to bypass cache

### Debug Mode
Set `NODE_ENV=development` for detailed logging.

## Contributing

This project uses ESM modules and follows senior-level coding standards. All contributions should maintain:
- Comprehensive error handling
- Proper TypeScript-style JSDoc documentation
- Performance optimization considerations
- Security best practices

## License

Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International License (CC BY-NC-ND 4.0). Personal and non-commercial use permitted.