import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRegionalTicketViewBundleEngine } from "./regional-ticket-view-bundle-engine.js";
import { newRegionalTicketViewBundle } from "./regional-ticket-view-bundle.js";

test("RegionalTicketViewBundleEngine keeps results within bounds", () => {
  const engine = defaultRegionalTicketViewBundleEngine(flags.newRegistry());
  const item = newRegionalTicketViewBundle("code-436", "label-941");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
