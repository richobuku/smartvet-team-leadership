import "dotenv/config";
import app from "./app";
import { startReminderCron } from "./lib/reminderCron";

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`SmartVet Performance API listening on port ${PORT}`);
});

startReminderCron();
