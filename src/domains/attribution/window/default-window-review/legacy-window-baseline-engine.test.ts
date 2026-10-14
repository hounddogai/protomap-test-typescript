import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultLegacyWindowBaselineEngine } from "./legacy-window-baseline-engine.js";
import { newLegacyWindowBaseline } from "./legacy-window-baseline.js";

test("LegacyWindowBaselineEngine keeps results within bounds", () => {
  const engine = defaultLegacyWindowBaselineEngine();
  const item = newLegacyWindowBaseline("code-688", "label-837");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
