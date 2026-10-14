import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPendingMacroBaselineEngine } from "./pending-macro-baseline-engine.js";
import { newPendingMacroBaseline } from "./pending-macro-baseline.js";

test("PendingMacroBaselineEngine keeps results within bounds", () => {
  const engine = defaultPendingMacroBaselineEngine();
  const item = newPendingMacroBaseline("code-670", "name-784");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
