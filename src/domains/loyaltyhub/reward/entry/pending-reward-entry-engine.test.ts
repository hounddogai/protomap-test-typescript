import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPendingRewardEntryEngine } from "./pending-reward-entry-engine.js";
import { newPendingRewardEntry } from "./pending-reward-entry.js";

test("PendingRewardEntryEngine keeps results within bounds", () => {
  const engine = defaultPendingRewardEntryEngine(flags.newRegistry());
  const item = newPendingRewardEntry("code-286", "name-311");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
