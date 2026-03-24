/**
 * Sends a message back through the Beeper Desktop Local API (or generic webhook).
 * Replace the implementation below with the actual Beeper/Matrix API once available.
 */
export async function sendMessageViaPlatform(
  conversationId: string,
  content: string
): Promise<void> {
  const apiUrl = process.env.BEEPER_API_URL;
  const apiToken = process.env.BEEPER_API_TOKEN;

  if (!apiUrl || !apiToken) {
    throw new Error("Beeper API credentials not configured in .env.local");
  }

  const response = await fetch(`${apiUrl}/send`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiToken}`,
    },
    body: JSON.stringify({
      chatId: conversationId,
      message: content,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Beeper API error (${response.status}): ${errorBody}`);
  }
}
