export default function handler(req, res) {
  if (req.method === 'POST') {
     const data = req.body;
    console.log('Recieved:', data);
    res.status(200).json({ message: 'success!', data});
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
