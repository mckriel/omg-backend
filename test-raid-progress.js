/**
 * @file Test script for raid progress functionality including MongoDB caching
 */

import dotenv from 'dotenv';
dotenv.config();

import { getAllSeasons, getCurrentSeason, getSeasonInfo } from './src/config/seasons.js';
import { 
  connectToDatabase, 
  closeDatabase,
  saveSeasonRaidProgress,
  getSeasonRaidProgress,
  getAllSeasonRaidProgress,
  hasSeasonRaidProgress,
  getAllActiveMembers
} from './src/database.js';
import { 
  getGuildProgressSummary,
  getGuildRaidProgressAllSeasonsCached,
  getGuildRaidProgressBySeasonCached
} from './src/services/guildRaidProgress.js';

console.log('🏛️ Testing Guild Raid Progress System with MongoDB Caching\n');

async function testSeasonConfiguration() {
  console.log('📅 Available Seasons:');
  const seasons = getAllSeasons();
  seasons.forEach(season => {
    console.log(`  • ${season.name} (${season.id})`);
    console.log(`    📅 ${season.startDate} → ${season.endDate || 'Current'}`);
    season.raids.forEach(raid => {
      console.log(`    ⚔️  ${raid.name} (${raid.bossCount} bosses)`);
      console.log(`       Difficulties: ${raid.difficulties.join(', ')}`);
    });
    console.log('');
  });

  console.log('🎯 Current Season:', getCurrentSeason().name);

  console.log('\n🔍 Season Lookup Test:');
  console.log('Season 1:', getSeasonInfo('season-1')?.name);
  console.log('Season 2:', getSeasonInfo('season-2')?.name);
  console.log('Invalid:', getSeasonInfo('season-99'));
}

async function testDatabaseConnection() {
  console.log('\n🔗 Testing Database Connection...');
  try {
    await connectToDatabase();
    console.log('✅ Database connection successful');
    
    // Test member count
    const members = await getAllActiveMembers();
    console.log(`📊 Found ${members.length} active guild members`);
    
    return true;
  } catch (error) {
    console.log('❌ Database connection failed:', error.message);
    return false;
  }
}

async function testRaidProgressCaching() {
  console.log('\n💾 Testing Raid Progress Caching...');
  
  try {
    // Check if we have cached data
    const hasS1Data = await hasSeasonRaidProgress('season-1');
    const hasS2Data = await hasSeasonRaidProgress('season-2');
    
    console.log(`Season 1 cached data: ${hasS1Data ? '✅ Yes' : '❌ No'}`);
    console.log(`Season 2 cached data: ${hasS2Data ? '✅ Yes' : '❌ No'}`);
    
    if (hasS1Data || hasS2Data) {
      console.log('\n📋 Cached Data Summary:');
      const allCached = await getAllSeasonRaidProgress();
      allCached.forEach(season => {
        console.log(`  • ${season.seasonName}: ${season.totalMembers} members, ${season.raids.length} raids`);
        console.log(`    Last updated: ${season.lastUpdated.toISOString()}`);
      });
    } else {
      console.log('ℹ️  No cached raid progress found - will generate on first guild update');
    }
    
    return true;
  } catch (error) {
    console.log('❌ Raid progress caching test failed:', error.message);
    return false;
  }
}

async function testServiceFunctions() {
  console.log('\n⚙️ Testing Service Functions...');
  
  try {
    // Test home page summary
    console.log('Testing getGuildProgressSummary...');
    const summary = await getGuildProgressSummary();
    
    if (summary.error) {
      console.log(`⚠️  Summary error: ${summary.error}`);
    } else {
      console.log(`✅ Home page summary: ${summary.currentSeason}, ${summary.totalMembers} members`);
      if (summary.raids && summary.raids.length > 0) {
        summary.raids.forEach(raid => {
          console.log(`   🏛️ ${raid.name}:`);
          console.log(`      Heroic: ${raid.heroicProgress.completed}/${raid.heroicProgress.total} (${raid.heroicProgress.percentage}%)`);
          console.log(`      Mythic: ${raid.mythicProgress.completed}/${raid.mythicProgress.total} (${raid.mythicProgress.percentage}%)`);
        });
      }
    }
    
    // Test cached vs live calculation
    console.log('\nTesting cached data retrieval...');
    const cachedData = await getGuildRaidProgressAllSeasonsCached();
    console.log(`${cachedData.cached ? '💾 Using cached data' : '📊 Live calculation performed'}`);
    
    if (cachedData.seasons) {
      const seasonCount = Object.keys(cachedData.seasons).length;
      console.log(`✅ Retrieved data for ${seasonCount} seasons`);
    }
    
    return true;
  } catch (error) {
    console.log('❌ Service function test failed:', error.message);
    return false;
  }
}

async function createMockData() {
  console.log('\n🧪 Creating mock cached data for testing...');
  
  const mockSeasonData = {
    season: { id: 'season-2', name: 'Season 2' },
    totalMembers: 25,
    raids: [
      {
        raidName: 'Liberation of Undermine',
        difficulties: {
          'LFR': { membersCompleted: 20, membersWithProgress: 23 },
          'Normal': { membersCompleted: 15, membersWithProgress: 18 },
          'Heroic': { membersCompleted: 8, membersWithProgress: 12 },
          'Mythic': { membersCompleted: 2, membersWithProgress: 5 }
        }
      }
    ]
  };
  
  try {
    await saveSeasonRaidProgress('season-2', mockSeasonData);
    console.log('✅ Mock data saved successfully');
    
    // Test retrieval
    const retrieved = await getSeasonRaidProgress('season-2');
    console.log(`✅ Mock data retrieved: ${retrieved.raids.length} raids for ${retrieved.totalMembers} members`);
    
    return true;
  } catch (error) {
    console.log('❌ Mock data creation failed:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Starting comprehensive raid progress tests...\n');
  
  let passed = 0;
  let total = 0;
  
  // Test 1: Season configuration
  total++;
  try {
    await testSeasonConfiguration();
    console.log('✅ Season configuration test passed');
    passed++;
  } catch (error) {
    console.log('❌ Season configuration test failed:', error.message);
  }
  
  // Test 2: Database connection
  total++;
  const dbConnected = await testDatabaseConnection();
  if (dbConnected) passed++;
  
  if (dbConnected) {
    // Test 3: Raid progress caching
    total++;
    const cachingWorked = await testRaidProgressCaching();
    if (cachingWorked) passed++;
    
    // Test 4: Service functions
    total++;
    const servicesWorked = await testServiceFunctions();
    if (servicesWorked) passed++;
    
    // Test 5: Mock data (optional)
    total++;
    try {
      const mockCreated = await createMockData();
      if (mockCreated) passed++;
    } catch (error) {
      console.log('❌ Mock data test failed:', error.message);
    }
  }
  
  console.log(`\n📊 Test Results: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All tests passed! The raid progress system is ready to deploy.');
  } else {
    console.log('⚠️  Some tests failed. Check the errors above before deploying.');
  }
  
  console.log('\n📚 Available API Endpoints:');
  console.log('  GET /guild-progress                      - Home page summary (Heroic + Mythic)');
  console.log('  GET /guild-progress/current              - Current season progress'); 
  console.log('  GET /guild-progress/all-seasons          - All seasons (cached)');
  console.log('  GET /guild-progress/all-seasons?force=true - All seasons (live)');
  console.log('  GET /guild-progress/season/season-1      - Season 1 (cached)');
  console.log('  GET /guild-progress/season/season-2?force=true - Season 2 (live)');
  console.log('  GET /guild-progress/seasons              - Available seasons list');
  
  await closeDatabase();
  process.exit(0);
}

// Run the tests
runAllTests().catch(error => {
  console.error('💥 Test suite crashed:', error);
  process.exit(1);
});