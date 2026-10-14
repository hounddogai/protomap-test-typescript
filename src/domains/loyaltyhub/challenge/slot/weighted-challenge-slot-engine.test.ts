import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultWeightedChallengeSlotEngine } from "./weighted-challenge-slot-engine.js";
import { newWeightedChallengeSlot } from "./weighted-challenge-slot.js";

test("WeightedChallengeSlotEngine keeps results within bounds", () => {
  const engine = defaultWeightedChallengeSlotEngine(flags.newRegistry());
  const item = newWeightedChallengeSlot("code-234", "label-895");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
