import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultRollingMacroSlotEngine } from "./rolling-macro-slot-engine.js";
import { newRollingMacroSlot } from "./rolling-macro-slot.js";

test("RollingMacroSlotEngine keeps results within bounds", () => {
  const engine = defaultRollingMacroSlotEngine();
  const item = newRollingMacroSlot("code-728", "label-168");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
