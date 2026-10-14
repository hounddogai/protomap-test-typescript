import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPrimaryApprovalSummaryEngine } from "./primary-approval-summary-engine.js";
import { newPrimaryApprovalSummary } from "./primary-approval-summary.js";

test("PrimaryApprovalSummaryEngine keeps results within bounds", () => {
  const engine = defaultPrimaryApprovalSummaryEngine(flags.newRegistry());
  const item = newPrimaryApprovalSummary("code-350", "label-558");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
