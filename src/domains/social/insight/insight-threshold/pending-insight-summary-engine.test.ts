import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPendingInsightSummaryEngine } from "./pending-insight-summary-engine.js";
import { newPendingInsightSummary } from "./pending-insight-summary.js";

test("PendingInsightSummaryEngine keeps results within bounds", () => {
  const engine = defaultPendingInsightSummaryEngine();
  const item = newPendingInsightSummary("code-156", "name-313");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
