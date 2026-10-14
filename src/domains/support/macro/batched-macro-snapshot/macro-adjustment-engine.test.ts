import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultMacroAdjustmentEngine } from "./macro-adjustment-engine.js";
import { newMacroAdjustment } from "./macro-adjustment.js";

test("MacroAdjustmentEngine keeps results within bounds", () => {
  const engine = defaultMacroAdjustmentEngine();
  const item = newMacroAdjustment("code-491", "title-880");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
