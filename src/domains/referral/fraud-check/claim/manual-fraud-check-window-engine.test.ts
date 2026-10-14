import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultManualFraudCheckWindowEngine } from "./manual-fraud-check-window-engine.js";
import { newManualFraudCheckWindow } from "./manual-fraud-check-window.js";

test("ManualFraudCheckWindowEngine keeps results within bounds", () => {
  const engine = defaultManualFraudCheckWindowEngine();
  const item = newManualFraudCheckWindow("code-130", "label-453");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
