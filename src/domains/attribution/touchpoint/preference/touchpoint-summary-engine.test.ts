import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultTouchpointSummaryEngine } from "./touchpoint-summary-engine.js";
import { newTouchpointSummary } from "./touchpoint-summary.js";

test("TouchpointSummaryEngine keeps results within bounds", () => {
  const engine = defaultTouchpointSummaryEngine();
  const item = newTouchpointSummary("code-694", "label-137");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
