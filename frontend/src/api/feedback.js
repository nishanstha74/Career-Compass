export const sendFeedback = async ({ name = "", message }) => {
  const payload = {
    name: name.trim(),
    message: message.trim(),
  };

  const response = await fetch(
    `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/feedback`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.message || "Failed to send feedback");
  }

  return await response.json();
};
