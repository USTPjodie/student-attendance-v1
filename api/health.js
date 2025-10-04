export default function handler(request, response) {
  response.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    message: 'Vercel deployment is working correctly'
  });
}