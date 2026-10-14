import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPendingCreativeSummaryEngine } from "./pending-creative-summary-engine.js";
import { newPendingCreativeSummary } from "./pending-creative-summary.js";

test("PendingCreativeSummaryEngine keeps results within bounds", () => {
  const engine = defaultPendingCreativeSummaryEngine();
  const item = newPendingCreativeSummary("code-40", "name-308");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
