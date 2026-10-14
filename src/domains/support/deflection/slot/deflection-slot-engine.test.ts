import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultDeflectionSlotEngine } from "./deflection-slot-engine.js";
import { newDeflectionSlot } from "./deflection-slot.js";

test("DeflectionSlotEngine keeps results within bounds", () => {
  const engine = defaultDeflectionSlotEngine();
  const item = newDeflectionSlot("code-281", "name-192");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
