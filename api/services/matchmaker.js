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
    const pendingRequests = await PendingMatch.find({ userId: { $ne: userId } });
    
    let matchedPending = null;
    for (const pending of pendingRequests) {
      const distance = getDistanceFromLatLonInM(lat, lon, pending.location.lat, pending.location.lon);
      if (distance <= MATCH_RADIUS_M) {
        matchedPending = await PendingMatch.findOneAndDelete({ _id: pending._id });
        if (matchedPending) break;
      }
    }

    if (matchedPending) {
       // We matched with someone!
       let connection = await Connection.findOneAndUpdate(
         {
           $or: [
             { user1_id: userId, user2_id: matchedPending.userId },
             { user1_id: matchedPending.userId, user2_id: userId }
           ]
         },
         { $set: { location: { lat, lon }, timestamp: Date.now(), status: 'pending', acceptedBy: [] } },
         { new: true }
       );

       if (!connection) {
         connection = new Connection({
           user1_id: userId,
           user2_id: matchedPending.userId,
           location: { lat, lon },
           status: 'pending',
           acceptedBy: []
         });
         await connection.save();
       }

       await User.findByIdAndUpdate(userId, { $pull: { hiddenConnections: matchedPending.userId } });
       await User.findByIdAndUpdate(matchedPending.userId, { $pull: { hiddenConnections: userId } });
       
       const otherUser = await User.findById(matchedPending.userId).select('-password');
       return res.status(200).json({ success: true, match: otherUser, connectionId: connection._id, status: connection.status });
    }

    // 2. If no match found, insert ourselves into the pending pool
    await PendingMatch.findOneAndDelete({ userId }); 
    
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
        timestamp: { $gte: new Date(Date.now() - 15000) }
      });

      if (connection) {
         const matchedUserId = connection.user1_id.toString() === userId ? connection.user2_id : connection.user1_id;
         const otherUser = await User.findById(matchedUserId).select('-password');
         return res.status(200).json({ success: true, match: otherUser, connectionId: connection._id, status: connection.status });
      }
    }

    // 4. Timeout reached
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
