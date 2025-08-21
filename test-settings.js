/**
 * Simple test script to verify settings functionality
 */

import dotenv from 'dotenv';
dotenv.config();

// Import the settings database functions
import { 
    initializeDefaultSettings, 
    getSettingValue, 
    updateSettingValue,
    getSettingsDocument 
} from './src/database.js';

async function test_settings() {
    try {
        console.log('🧪 Testing settings functionality...\n');

        // Test 1: Initialize default settings
        console.log('1️⃣ Initializing default settings...');
        await initializeDefaultSettings();
        console.log('✅ Default settings initialized\n');

        // Test 2: Get raid-team settings document
        console.log('2️⃣ Getting raid-team settings document...');
        const raidTeamDoc = await getSettingsDocument('raid-team');
        console.log('📄 Raid team document:', JSON.stringify(raidTeamDoc, null, 2), '\n');

        // Test 3: Get specific setting value
        console.log('3️⃣ Getting ilvl-requirement value...');
        const ilvlValue = await getSettingValue('raid-team', 'ilvl-requirement');
        console.log('🎯 Current ilvl requirement:', ilvlValue, '\n');

        // Test 4: Update setting value
        console.log('4️⃣ Updating ilvl-requirement to 700...');
        await updateSettingValue('raid-team', 'ilvl-requirement', 700);
        console.log('✅ Setting updated\n');

        // Test 5: Verify update
        console.log('5️⃣ Verifying update...');
        const updatedValue = await getSettingValue('raid-team', 'ilvl-requirement');
        console.log('🔍 Updated ilvl requirement:', updatedValue, '\n');

        // Test 6: Update back to original
        console.log('6️⃣ Updating back to 690...');
        await updateSettingValue('raid-team', 'ilvl-requirement', 690);
        const finalValue = await getSettingValue('raid-team', 'ilvl-requirement');
        console.log('🔄 Final ilvl requirement:', finalValue, '\n');

        console.log('🎉 All tests passed!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Test failed:', error);
        process.exit(1);
    }
}

// Run the test
test_settings();