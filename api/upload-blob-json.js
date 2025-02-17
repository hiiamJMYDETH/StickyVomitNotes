export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { fileName, content } = req.body;
        let finalContent = '';
        if (!fileName || !content) {
            return res.status(400).json({ error: 'Invalid file data' });
        }
    
        finalContent = content.join('\n');
    
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Content-Type', 'application/json');
        res.send(finalContent);
    }
    else {
        res.status(405).json({ error: "Method not allowed" });
    }
}