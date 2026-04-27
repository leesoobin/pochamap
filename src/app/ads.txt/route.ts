export async function GET() {
  return new Response('google.com, pub-4098269039875449, DIRECT, f08c47fec0942fa0\n', {
    headers: { 'Content-Type': 'text/plain' },
  })
}
