import { app } from "./app.js";
import { env } from "./config/env.js";

app.listen(env.PORT, () => {
  // Keep startup logs explicit for container/platform logs.
  console.log(`Backend listening on http://localhost:${env.PORT}`);
});
