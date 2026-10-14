import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultStrictPostSummaryEngine } from "./strict-post-summary-engine.js";
import { newStrictPostSummary } from "./strict-post-summary.js";

test("StrictPostSummaryEngine keeps results within bounds", () => {
  const engine = defaultStrictPostSummaryEngine();
  const item = newStrictPostSummary("code-433", "title-946");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
