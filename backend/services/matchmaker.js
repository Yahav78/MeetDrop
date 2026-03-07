const { getDistanceFromLatLonInM } = require('../utils/geo');
const Connection = require('../models/Connection');
const User = require('../models/User');
const PendingMatch = require('../models/PendingMatch');

// Match distance threshold in meters
const MATCH_RADIUS_M = 50;
// Match timeout in milliseconds
const MATCH_POLL_INTERVAL_MS = 1000;
const MAX_POLLS = 10;

async function handleMatchRequest(userId, lat, lon, req, res) {
  try {
    // 1. Check if there are any other pending requests we can match with
    // We fetch all pending matches not from this user. In a larger production app,
    // we would use MongoDB geospatial indexes ($nearSphere) for better bounds checking.
    const pendingRequests = await PendingMatch.find({ userId: { $ne: userId } });
    
    let matchedPending = null;
    for (const pending of pendingRequests) {
      const distance = getDistanceFromLatLonInM(lat, lon, pending.location.lat, pending.location.lon);
      if (distance <= MATCH_RADIUS_M) {
        // Attempt atomic findOneAndDelete to prevent race condition 
        // if multiple concurrent users try to claim this same pending request
        matchedPending = await PendingMatch.findOneAndDelete({ _id: pending._id });
        if (matchedPending) {
           break; // We successfully claimed this pending match
        }
      }
    }

    if (matchedPending) {
       // We matched with someone!
       // Try to update existing connection or create a new one
       let connection = await Connection.findOneAndUpdate(
         {
           $or: [
             { user1_id: userId, user2_id: matchedPending.userId },
             { user1_id: matchedPending.userId, user2_id: userId }
           ]
         },
         { $set: { location: { lat, lon }, timestamp: Date.now() } },
         { new: true }
       );

       if (!connection) {
         connection = new Connection({
           user1_id: userId,
           user2_id: matchedPending.userId,
           location: { lat, lon }
         });
         await connection.save();
       }

       // Un-hide users from each other's history (fix for deleted users not reappearing)
       await User.findByIdAndUpdate(userId, { $pull: { hiddenConnections: matchedPending.userId } });
       await User.findByIdAndUpdate(matchedPending.userId, { $pull: { hiddenConnections: userId } });
       
       // Return the other user's profile immediately
       const otherUser = await User.findById(matchedPending.userId).select('-password');
       return res.status(200).json({ success: true, match: otherUser });
    }

    // 2. If no match found, insert ourselves into the pending pool
    await PendingMatch.findOneAndDelete({ userId }); // Ensure no stale duplicates
    
    const myPending = new PendingMatch({
      userId,
      location: { lat, lon }
    });
    await myPending.save();

    // 3. Poll the Connection collection to see if someone else matched with us
    let polls = 0;
    while (polls < MAX_POLLS) {
      await new Promise(r => setTimeout(r, MATCH_POLL_INTERVAL_MS));
      polls++;
      
      const connection = await Connection.findOne({
        $or: [
           { user1_id: userId },
           { user2_id: userId }
        ],
        timestamp: { $gte: new Date(Date.now() - 15000) } // Recently created
      });

      if (connection) {
         // Found! The other person created the connection.
         const matchedUserId = connection.user1_id.toString() === userId ? connection.user2_id : connection.user1_id;
         const otherUser = await User.findById(matchedUserId).select('-password');
         return res.status(200).json({ success: true, match: otherUser });
      }
    }

    // 4. Timeout reached, delete pending and return 408
    await PendingMatch.findOneAndDelete({ _id: myPending._id });
    return res.status(408).json({ error: 'No match found within 10 seconds. Try again.' });

  } catch (error) {
    console.error('Match error:', error);
    res.status(500).json({ error: 'Failed to process match' });
  }
}

module.exports = {
  handleMatchRequest
};
