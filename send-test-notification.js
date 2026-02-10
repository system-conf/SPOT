require('dotenv').config();

const API_SECRET = process.env.API_SECRET;
const PORT = 3005; // Using 3005 as confirmed active

if (!API_SECRET) {
    console.error("Error: API_SECRET not found in .env");
    process.exit(1);
}

async function sendTestNotification() {
    console.log("Sending test notification...");

    try {
        const response = await fetch(`http://localhost:${PORT}/api/notify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_SECRET}`
            },
            body: JSON.stringify({
                title: "Rich Notification Test",
                body: "This notification should have an image and a custom badge.",
                icon: "https://cdn-icons-png.flaticon.com/512/3119/3119338.png",
                image: "https://picsum.photos/600/300", // Large image
                badge: "https://cdn-icons-png.flaticon.com/128/3119/3119338.png", // Small badge
                url: "/debug/notifications" // Relative URL test
            })
        });

        const data = await response.json();

        console.log("Response Status:", response.status);
        console.log("Response Body:", JSON.stringify(data, null, 2));

        if (response.ok) {
            console.log("\n✅ Test notification sent successfully!");
        } else {
            console.error("\n❌ Failed to send notification.");
        }

    } catch (error) {
        console.error("\n❌ Error sending request:", error);
    }
}

sendTestNotification();
