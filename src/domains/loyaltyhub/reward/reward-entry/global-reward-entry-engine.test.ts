import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultGlobalRewardEntryEngine } from "./global-reward-entry-engine.js";
import { newGlobalRewardEntry } from "./global-reward-entry.js";

test("GlobalRewardEntryEngine keeps results within bounds", () => {
  const engine = defaultGlobalRewardEntryEngine(flags.newRegistry());
  const item = newGlobalRewardEntry("code-679", "name-489");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
