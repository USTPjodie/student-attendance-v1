export default function handler(request, response) {
  response.status(200).json({ 
    message: 'Vercel API test endpoint working!',
    timestamp: new Date().toISOString(),
    method: request.method,
    query: request.query,
    body: request.body
  });
}