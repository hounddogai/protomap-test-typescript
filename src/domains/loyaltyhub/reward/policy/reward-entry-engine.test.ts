import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRewardEntryEngine } from "./reward-entry-engine.js";
import { newRewardEntry } from "./reward-entry.js";

test("RewardEntryEngine keeps results within bounds", () => {
  const engine = defaultRewardEntryEngine(flags.newRegistry());
  const item = newRewardEntry("code-136", "name-138");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
