import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultFallbackMacroSlotEngine } from "./fallback-macro-slot-engine.js";
import { newFallbackMacroSlot } from "./fallback-macro-slot.js";

test("FallbackMacroSlotEngine keeps results within bounds", () => {
  const engine = defaultFallbackMacroSlotEngine(flags.newRegistry());
  const item = newFallbackMacroSlot("code-930", "label-197");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
