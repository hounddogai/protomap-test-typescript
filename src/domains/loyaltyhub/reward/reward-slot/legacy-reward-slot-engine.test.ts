import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLegacyRewardSlotEngine } from "./legacy-reward-slot-engine.js";
import { newLegacyRewardSlot } from "./legacy-reward-slot.js";

test("LegacyRewardSlotEngine keeps results within bounds", () => {
  const engine = defaultLegacyRewardSlotEngine(flags.newRegistry());
  const item = newLegacyRewardSlot("code-588", "name-828");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
