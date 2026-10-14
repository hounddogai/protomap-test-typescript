import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultFallbackNudgeSummaryEngine } from "./fallback-nudge-summary-engine.js";
import { newFallbackNudgeSummary } from "./fallback-nudge-summary.js";

test("FallbackNudgeSummaryEngine keeps results within bounds", () => {
  const engine = defaultFallbackNudgeSummaryEngine();
  const item = newFallbackNudgeSummary("code-642", "label-624");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
