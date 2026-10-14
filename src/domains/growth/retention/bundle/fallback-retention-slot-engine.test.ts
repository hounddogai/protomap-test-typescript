import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultFallbackRetentionSlotEngine } from "./fallback-retention-slot-engine.js";
import { newFallbackRetentionSlot } from "./fallback-retention-slot.js";

test("FallbackRetentionSlotEngine keeps results within bounds", () => {
  const engine = defaultFallbackRetentionSlotEngine();
  const item = newFallbackRetentionSlot("code-662", "name-118");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
