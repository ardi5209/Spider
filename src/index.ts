import { db } from "./modules/db.mjs";
import { bot } from "./modules/tg.mjs";
import { writer } from "./modules/writer.mjs";

(async () => {
  await db.make();
  const accounts = await db.getAll();

  if (accounts) {
    writer.write(accounts);
  }
})();
