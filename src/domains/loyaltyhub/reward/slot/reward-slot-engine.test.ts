import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRewardSlotEngine } from "./reward-slot-engine.js";
import { newRewardSlot } from "./reward-slot.js";

test("RewardSlotEngine keeps results within bounds", () => {
  const engine = defaultRewardSlotEngine(flags.newRegistry());
  const item = newRewardSlot("code-803", "name-78");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
