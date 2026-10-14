import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultTicketViewBundleEngine } from "./ticket-view-bundle-engine.js";
import { newTicketViewBundle } from "./ticket-view-bundle.js";

test("TicketViewBundleEngine keeps results within bounds", () => {
  const engine = defaultTicketViewBundleEngine(flags.newRegistry());
  const item = newTicketViewBundle("code-78", "name-800");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
