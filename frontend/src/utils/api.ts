export class AuthExpiredError extends Error {}

export async function handleApiResponse(response: Response, logout: () => void) {
  if (response.status === 401) {
    logout();
    throw new AuthExpiredError('Session expired. Please login again.');
  }
  
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'An error occurred');
  }
  
  return data;
} 