import dotenv from 'dotenv';
dotenv.config();

const data = {
    // The following values are loaded from environment variables for your safety
    "API_BATTLENET_KEY": process.env.API_BATTLENET_KEY,
    "API_BATTLENET_SECRET": process.env.API_BATTLENET_SECRET,
    "GUILD_NAME": process.env.GUILD_NAME,
    "GUILD_REALM": process.env.GUILD_REALM,
    "REGION": process.env.REGION,
    "API_PARAM_REQUIREMENTGS": process.env.API_PARAM_REQUIREMENTGS,

    // Change the below settings that are specific to your guild and needs
    "LEVEL_REQUIREMENT": 80,
    "GUILD_RANK_REQUIREMENT": [0,1,2,3,4,5,6, 7,8,9,10],
    "ITEM_LEVEL_REQUIREMENT": 440,
    "MIN_CHECK_CAP": 640,
    "MAX_CHECK_CAP": 800,
    "MIN_TIER_ITEMLEVEL": 640,
    "ENCHANTABLE_PIECES": ["WRIST", "LEGS", "FEET", "CHEST", "MAIN_HAND", "FINGER_1", "FINGER_2"],
    "MAIN_RANKS": [0,1,2,3,4,5,6,7],
    "ALT_RANKS": [8,9,10],
    "TANKS": ["Blood", "Vengeance", "Guardian", "Brewmaster", "Protection"],
    "HEALERS": ["Preservation", "Mistweaver", "Holy", "Discipline", "Restoration"],
    "DIFFICULTY": ["Mythic", "Heroic", "Normal"],
    "_DRAFT_DIFFICULTY": ["LFR", "Raid Finder", "Mythic", "Heroic", "Normal"],
    "GUILLD_RANKS": [
        "Guild Master",
        "Council Member",
        "Officer",
        "Officer Alt",
        "Mythic Raider",
        "Alt Raider",
        "Raider Trial",
        "Social Raider",
        "Alt",
        "Social"
    ],
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

export default data;