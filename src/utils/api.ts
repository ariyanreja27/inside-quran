/**
 * Gets the base URL for the backend API.
 * Uses environment variable if provided, otherwise defaults to localhost for development.
 */
export function getApiUrl(): string {
  // If we have an environment variable set, use it
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // Default for local development
  return 'http://localhost:5000';
}
