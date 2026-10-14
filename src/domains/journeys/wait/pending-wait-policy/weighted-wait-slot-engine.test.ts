import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultWeightedWaitSlotEngine } from "./weighted-wait-slot-engine.js";
import { newWeightedWaitSlot } from "./weighted-wait-slot.js";

test("WeightedWaitSlotEngine keeps results within bounds", () => {
  const engine = defaultWeightedWaitSlotEngine(flags.newRegistry());
  const item = newWeightedWaitSlot("code-887", "label-300");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
