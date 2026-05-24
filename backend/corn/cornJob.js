import cron from "node-cron";

cron.schedule("0 0 28 * *", async () => {
  console.log("Sending rent reminders...");

  const users = await User.findAll();

  users.forEach(user => {
    sendWhatsApp(user.phone, "Please pay your rent");
  });
});