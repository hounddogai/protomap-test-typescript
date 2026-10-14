import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultBatchedMacroSlotEngine } from "./batched-macro-slot-engine.js";
import { newBatchedMacroSlot } from "./batched-macro-slot.js";

test("BatchedMacroSlotEngine keeps results within bounds", () => {
  const engine = defaultBatchedMacroSlotEngine();
  const item = newBatchedMacroSlot("code-853", "name-831");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
