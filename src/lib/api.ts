const SCRIPT_URL = "/script-api"; // Proxy to Apps Script web app

export async function sendRequest(payload: any): Promise<any> {
  try {
    // Special case for profile photo actions
    const useQuery = ['uploadProfilePhoto', 'removeProfilePhoto', 'getProfilePhoto'].includes(payload.action);

    if (useQuery) {
      const query = new URLSearchParams(payload).toString();
      const url = `${SCRIPT_URL}?${query}`;

      const res = await fetch(url);
      const text = await res.text();

      // Sometimes Apps Script returns raw text, not always JSON
      try {
        return JSON.parse(text);
      } catch {
        return { success: false, error: "Invalid JSON response from server." };
      }
    }

    // Default: JSON POST
    const res = await fetch(SCRIPT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      return { success: false, error: "Invalid JSON response from server." };
    }
  } catch (error: any) {
    console.error("API request error:", error);
    return { success: false, error: error.message || "Request failed" };
  }
}
