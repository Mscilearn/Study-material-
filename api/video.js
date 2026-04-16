// api/video.js
import { db } from './_firebase.js'; // Ensure you setup Firebase Admin SDK here like in BrainBox

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');
    if (req.method === 'OPTIONS') return res.status(200).end();
    
    // Environment variables exactly like your BrainBox setup
    const PUBLIC_KEY = "MsciPlayer_Public_Key_123";
    const ADMIN_KEY = process.env.ADMIN_SECRET_TOKEN; 
    const userKey = req.headers['x-api-key'];
    const { action, id } = req.query;

    // 1. GET VIDEO (Public - Requires Public Key)
    if (req.method === 'GET' && action === 'get_video') {
        if (userKey !== PUBLIC_KEY && userKey !== ADMIN_KEY) return res.status(401).json({ error: "Access Denied" });
        try {
            const doc = await db.collection('msci_videos').doc(id).get();
            if (!doc.exists) return res.status(404).json({ success: false, error: "Not found" });
            return res.status(200).json({ success: true, ...doc.data() });
        } catch(e) { return res.status(500).json({ error: e.message }); }
    }

    // --- SECURE ADMIN ACTIONS BELOW (Requires Admin Token) ---
    if (userKey !== ADMIN_KEY) return res.status(401).json({ error: "Admin Access Denied" });

    // 2. ADD VIDEO
    if (req.method === 'POST' && action === 'add_video') {
        try {
            const data = req.body;
            await db.collection('msci_videos').doc(data.id).set(data);
            return res.status(200).json({ success: true });
        } catch(e) { return res.status(500).json({ error: e.message }); }
    }

    // 3. GET ALL (History)
    if (req.method === 'GET' && action === 'get_all') {
        try {
            const snap = await db.collection('msci_videos').get();
            let videos = [];
            snap.forEach(doc => videos.push({ id: doc.id, title: doc.data().title }));
            return res.status(200).json({ success: true, videos });
        } catch(e) { return res.status(500).json({ error: e.message }); }
    }

    // 4. DELETE VIDEO
    if (req.method === 'DELETE' && action === 'delete_video') {
        try {
            await db.collection('msci_videos').doc(id).delete();
            return res.status(200).json({ success: true });
        } catch(e) { return res.status(500).json({ error: e.message }); }
    }
}
