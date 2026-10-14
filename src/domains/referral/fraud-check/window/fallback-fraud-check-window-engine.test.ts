import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultFallbackFraudCheckWindowEngine } from "./fallback-fraud-check-window-engine.js";
import { newFallbackFraudCheckWindow } from "./fallback-fraud-check-window.js";

test("FallbackFraudCheckWindowEngine keeps results within bounds", () => {
  const engine = defaultFallbackFraudCheckWindowEngine(flags.newRegistry());
  const item = newFallbackFraudCheckWindow("code-199", "name-177");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
