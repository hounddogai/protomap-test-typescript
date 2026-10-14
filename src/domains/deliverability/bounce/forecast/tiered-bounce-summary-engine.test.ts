import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultTieredBounceSummaryEngine } from "./tiered-bounce-summary-engine.js";
import { newTieredBounceSummary } from "./tiered-bounce-summary.js";

test("TieredBounceSummaryEngine keeps results within bounds", () => {
  const engine = defaultTieredBounceSummaryEngine();
  const item = newTieredBounceSummary("code-72", "name-930");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
