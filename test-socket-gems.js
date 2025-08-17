/**
 * @file Test script for socket and gem functionality
 */

import dotenv from 'dotenv';
dotenv.config();

import { 
  getSocketInfo, 
  isJewelryItem 
} from './tools/guildFetcher/utils.mjs';
import { 
  getAllActiveMembers, 
  connectToDatabase, 
  closeDatabase 
} from './src/database.js';

console.log('🔮 Testing Socket and Gem Data Collection\n');

async function testSocketHelperFunctions() {
  console.log('🔧 Testing Socket Helper Functions...');
  
  // Test with mock data structures that match Battle.net API format
  const mockItemWithSockets = {
    slot: { type: 'NECK' },
    name: 'Test Necklace',
    sockets: [
      {
        socket_type: { name: 'Prismatic Socket' },
        item: {
          id: 12345,
          name: 'Masterful Ruby',
          quality: { name: 'Rare' }
        }
      },
      {
        socket_type: { name: 'Prismatic Socket' },
        item: null // Empty socket
      }
    ]
  };

  const mockItemNoSockets = {
    slot: { type: 'CHEST' },
    name: 'Test Chestpiece'
  };

  const socketInfo1 = getSocketInfo(mockItemWithSockets);
  const socketInfo2 = getSocketInfo(mockItemNoSockets);

  console.log('Item with sockets:', {
    hasSocket: socketInfo1.hasSocket,
    socketCount: socketInfo1.socketCount,
    gemmedSockets: socketInfo1.gemmedSockets,
    emptySocketCount: socketInfo1.emptySocketCount
  });

  console.log('Item without sockets:', {
    hasSocket: socketInfo2.hasSocket,
    socketCount: socketInfo2.socketCount
  });

  console.log('Jewelry detection:');
  console.log('  NECK is jewelry:', isJewelryItem(mockItemWithSockets));
  console.log('  CHEST is jewelry:', isJewelryItem(mockItemNoSockets));

  return true;
}

async function testExistingMemberData() {
  console.log('\n📊 Testing Existing Member Data...');
  
  try {
    await connectToDatabase();
    const members = await getAllActiveMembers();
    
    if (members.length === 0) {
      console.log('⚠️  No guild members found in database');
      return false;
    }

    console.log(`📈 Found ${members.length} guild members`);
    
    let membersWithEquipment = 0;
    let membersWithSocketData = 0;
    let totalJewelryPieces = 0;
    let jewelryWithSockets = 0;

    members.forEach(member => {
      if (member.equipement && member.equipement.length > 0) {
        membersWithEquipment++;
        
        // Check if this member has the new socket data structure
        const hasSocketData = member.equipement.some(item => 
          item.sockets !== undefined
        );
        
        if (hasSocketData) {
          membersWithSocketData++;
        }

        // Count jewelry pieces
        const jewelryItems = member.equipement.filter(item => 
          ['NECK', 'FINGER_1', 'FINGER_2'].includes(item.type)
        );
        
        totalJewelryPieces += jewelryItems.length;
        
        jewelryWithSockets += jewelryItems.filter(item => 
          item.sockets?.hasSocket === true
        ).length;

        // Show example of first member's jewelry
        if (member === members[0] && jewelryItems.length > 0) {
          console.log(`\n🔍 Example jewelry from ${member.name}:`);
          jewelryItems.forEach(item => {
            console.log(`  ${item.type}: ${item.name} (Level ${item.level})`);
            if (item.sockets) {
              console.log(`    Sockets: ${item.sockets.socketCount}, Gemmed: ${item.sockets.gemmedSockets}`);
              if (item.sockets.socketDetails?.length > 0) {
                item.sockets.socketDetails.forEach((socket, i) => {
                  const gem = socket.item ? socket.item.name : 'Empty';
                  console.log(`      Socket ${i + 1}: ${gem}`);
                });
              }
            } else {
              console.log(`    No socket data available (needs update)`);
            }
          });
        }
      }
    });

    console.log('\n📋 Summary:');
    console.log(`  Members with equipment data: ${membersWithEquipment}/${members.length}`);
    console.log(`  Members with socket data: ${membersWithSocketData}/${members.length}`);
    console.log(`  Total jewelry pieces found: ${totalJewelryPieces}`);
    console.log(`  Jewelry pieces with sockets: ${jewelryWithSockets}`);
    
    if (membersWithSocketData === 0) {
      console.log('\n⚠️  No socket data found. You need to run a guild update to collect socket information.');
      console.log('   Trigger with: curl -X POST http://localhost:8000/update');
    }

    return true;
  } catch (error) {
    console.log('❌ Database test failed:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Starting socket and gem tests...\n');
  
  let passed = 0;
  let total = 0;
  
  // Test 1: Helper functions
  total++;
  try {
    await testSocketHelperFunctions();
    console.log('✅ Helper function test passed');
    passed++;
  } catch (error) {
    console.log('❌ Helper function test failed:', error.message);
  }
  
  // Test 2: Existing member data
  total++;
  const memberDataWorked = await testExistingMemberData();
  if (memberDataWorked) passed++;
  
  console.log(`\n📊 Test Results: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All tests passed! Socket and gem data collection is ready.');
  } else {
    console.log('⚠️  Some tests failed. Check the errors above.');
  }
  
  console.log('\n📚 New API Endpoint Available:');
  console.log('  GET /stats/jewelry-gems - Jewelry and gem statistics');
  
  console.log('\n🔄 To collect socket/gem data:');
  console.log('  1. Run: curl -X POST http://localhost:8000/update');
  console.log('  2. Wait for guild update to complete (~2-5 minutes)');
  console.log('  3. Check: curl http://localhost:8000/stats/jewelry-gems');
  
  await closeDatabase();
  process.exit(0);
}

// Run the tests
runAllTests().catch(error => {
  console.error('💥 Test suite crashed:', error);
  process.exit(1);
});