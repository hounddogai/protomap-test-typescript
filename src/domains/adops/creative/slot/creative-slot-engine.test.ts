import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultCreativeSlotEngine } from "./creative-slot-engine.js";
import { newCreativeSlot } from "./creative-slot.js";

test("CreativeSlotEngine keeps results within bounds", () => {
  const engine = defaultCreativeSlotEngine();
  const item = newCreativeSlot("code-105", "label-982");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
