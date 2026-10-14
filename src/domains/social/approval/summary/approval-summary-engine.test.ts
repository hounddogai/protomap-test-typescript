import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultApprovalSummaryEngine } from "./approval-summary-engine.js";
import { newApprovalSummary } from "./approval-summary.js";

test("ApprovalSummaryEngine keeps results within bounds", () => {
  const engine = defaultApprovalSummaryEngine(flags.newRegistry());
  const item = newApprovalSummary("code-621", "title-345");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
