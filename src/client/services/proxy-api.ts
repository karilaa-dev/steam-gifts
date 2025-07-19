/**
 * Makes a request to the secure backend proxy.
 * This function will be used for all Steam API calls that require a secret API key.
 * The backend will attach the key and forward the request to the Steam API.
 * 
 * @param endpoint The Steam API endpoint to call (e.g., 'ISteamUser/GetFriendList/v1').
 * @param params Query parameters for the Steam API call.
 * @returns A promise that resolves to the JSON response from the Steam API.
 */
export async function proxyRequest<T>(endpoint: string, params: Record<string, string>): Promise<T> {
  const query = new URLSearchParams(params).toString();
  const url = `/api/proxy/${endpoint}?${query}`;

  const response = await fetch(url, {
    credentials: 'include'
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'A network error occurred.' }));
    throw new Error(errorData.error || `Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}