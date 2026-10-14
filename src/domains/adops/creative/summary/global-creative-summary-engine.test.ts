import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultGlobalCreativeSummaryEngine } from "./global-creative-summary-engine.js";
import { newGlobalCreativeSummary } from "./global-creative-summary.js";

test("GlobalCreativeSummaryEngine keeps results within bounds", () => {
  const engine = defaultGlobalCreativeSummaryEngine();
  const item = newGlobalCreativeSummary("code-825", "label-187");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
