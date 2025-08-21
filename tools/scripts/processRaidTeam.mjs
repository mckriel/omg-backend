import figlet from 'figlet';
import gradient from 'gradient-string';
import { connect_mongoose } from '../../src/connections/mongo.js';
import { getAllActiveMembers } from '../../src/database.js';
import { process_guild_data } from '../../src/services/raid_team.js';

console.log(gradient.pastel.multiline(figlet.textSync('Raid Team Processor', {
    horizontalLayout: 'full'
})));
console.log(gradient.cristal.multiline('Processing guild members for raid team'));
console.log(gradient.morning('Copyright 2025 all rights reserved\n'));

async function process_raid_team() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await connect_mongoose();
    
    console.log('📥 Fetching active guild members...');
    const active_members = await getAllActiveMembers();
    
    if (!active_members.length) {
      console.log('⚠️  No active members found in database');
      process.exit(1);
    }
    
    console.log('🚀 Starting raid team processing...');
    const result = await process_guild_data(active_members);
    
    console.log('\n📈 Raid team processing summary:');
    console.log(`   Total processed: ${result.processed}`);
    console.log(`   Created: ${result.created}`);
    console.log(`   Updated: ${result.updated}`);
    console.log(`   Deactivated: ${result.deactivated}`);
    console.log(`   Errors: ${result.errors.length}`);
    
    if (result.errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      result.errors.forEach(error => {
        console.log(`   ${error.character}: ${error.error}`);
      });
    }
    
    console.log('\n✅ Raid team processing completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Raid team processing failed:', error.message);
    process.exit(1);
  }
}

process_raid_team();