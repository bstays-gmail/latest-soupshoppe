interface PushoverMessage {
  title: string;
  message: string;
  priority?: number;
  sound?: string;
}

export async function sendPushoverNotification(data: PushoverMessage): Promise<boolean> {
  const userKey = process.env.PUSHOVER_USER_KEY;
  const apiToken = process.env.PUSHOVER_API_TOKEN;

  if (!userKey || !apiToken) {
    console.log("Pushover notifications disabled - PUSHOVER_USER_KEY or PUSHOVER_API_TOKEN not configured");
    return false;
  }

  try {
    const response = await fetch("https://api.pushover.net/1/messages.json", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token: apiToken,
        user: userKey,
        title: data.title,
        message: data.message,
        priority: data.priority ?? 0,
        sound: data.sound ?? "pushover",
      }),
    });

    const result = await response.json();

    if (response.ok && result.status === 1) {
      console.log(`Pushover notification sent: ${data.title}`);
      return true;
    } else {
      console.error("Pushover API error:", result);
      return false;
    }
  } catch (error) {
    console.error("Failed to send Pushover notification:", error);
    return false;
  }
}
