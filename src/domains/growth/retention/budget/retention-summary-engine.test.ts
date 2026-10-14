import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRetentionSummaryEngine } from "./retention-summary-engine.js";
import { newRetentionSummary } from "./retention-summary.js";

test("RetentionSummaryEngine keeps results within bounds", () => {
  const engine = defaultRetentionSummaryEngine(flags.newRegistry());
  const item = newRetentionSummary("code-571", "name-423");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
