import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultFallbackSlaSummaryEngine } from "./fallback-sla-summary-engine.js";
import { newFallbackSlaSummary } from "./fallback-sla-summary.js";

test("FallbackSlaSummaryEngine keeps results within bounds", () => {
  const engine = defaultFallbackSlaSummaryEngine();
  const item = newFallbackSlaSummary("code-99", "title-138");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
