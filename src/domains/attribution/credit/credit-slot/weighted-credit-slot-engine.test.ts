import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultWeightedCreditSlotEngine } from "./weighted-credit-slot-engine.js";
import { newWeightedCreditSlot } from "./weighted-credit-slot.js";

test("WeightedCreditSlotEngine keeps results within bounds", () => {
  const engine = defaultWeightedCreditSlotEngine(flags.newRegistry());
  const item = newWeightedCreditSlot("code-870", "name-437");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
