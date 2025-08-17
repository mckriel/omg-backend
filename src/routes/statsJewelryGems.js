/**
 * @file Route handler for /stats/jewelry-gems endpoint.
 * @module routes/statsJewelryGems
 */

import express from 'express';
import { getAllActiveMembers } from '../database.js';
import { transformCharacterData } from '../utils.js';

/**
 * GET /stats/jewelry-gems - Returns jewelry and gem statistics.
 * @route GET /stats/jewelry-gems
 * @returns {Object} JSON response with jewelry and gem data.
 */
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const activeMembers = await getAllActiveMembers();
    if (!activeMembers.length) {
      return res.status(404).json({ success: false, error: 'No guild data available' });
    }

    const jewelryStats = {
      totalMembers: activeMembers.length,
      jewelryData: [],
      summary: {
        membersWithSocketedJewelry: 0,
        totalJewelryPieces: 0,
        totalSockets: 0,
        gemmedSockets: 0,
        emptySocketCount: 0,
        commonGems: {}
      }
    };

    activeMembers.forEach(member => {
      const memberJewelry = {
        name: member.name,
        server: member.server,
        class: member.metaData?.class,
        spec: member.metaData?.spec,
        guildRank: member.guildData?.rank,
        jewelry: []
      };

      if (member.equipement) {
        // Filter for jewelry items (rings and neck) - fallback to slot type for older data
        const jewelryItems = member.equipement.filter(item => 
          item.isJewelry || ['NECK', 'FINGER_1', 'FINGER_2'].includes(item.type)
        );
        
        jewelryItems.forEach(item => {
          const jewelryPiece = {
            slot: item.type,
            name: item.name,
            level: item.level,
            sockets: item.sockets || {
              hasSocket: false,
              socketCount: 0,
              gemmedSockets: 0,
              emptySocketCount: 0,
              socketDetails: []
            }
          };

          // Count gems for summary statistics
          if (item.sockets?.socketDetails?.length) {
            item.sockets.socketDetails.forEach(socket => {
              if (socket.item) {
                const gemName = socket.item.name;
                jewelryStats.summary.commonGems[gemName] = (jewelryStats.summary.commonGems[gemName] || 0) + 1;
              }
            });
          }

          memberJewelry.jewelry.push(jewelryPiece);
          jewelryStats.summary.totalJewelryPieces++;
          
          if (item.sockets?.hasSocket) {
            jewelryStats.summary.totalSockets += item.sockets.socketCount;
            jewelryStats.summary.gemmedSockets += item.sockets.gemmedSockets;
            jewelryStats.summary.emptySocketCount += item.sockets.emptySocketCount;
          }
        });

        // Only include members who have socketed jewelry
        if (jewelryItems.some(item => item.sockets?.hasSocket)) {
          jewelryStats.summary.membersWithSocketedJewelry++;
          jewelryStats.jewelryData.push(memberJewelry);
        }
      }
    });

    // Convert gem counts to sorted array for better display
    jewelryStats.summary.popularGems = Object.entries(jewelryStats.summary.commonGems)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    delete jewelryStats.summary.commonGems;

    res.json({
      success: true,
      data: jewelryStats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to read jewelry and gem statistics', 
      message: error.message 
    });
  }
});

export default router;