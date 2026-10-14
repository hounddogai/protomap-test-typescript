import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultWaitSummaryEngine } from "./wait-summary-engine.js";
import { newWaitSummary } from "./wait-summary.js";

test("WaitSummaryEngine keeps results within bounds", () => {
  const engine = defaultWaitSummaryEngine();
  const item = newWaitSummary("code-221", "label-655");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
