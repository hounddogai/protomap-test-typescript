import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPendingApprovalMilestoneEngine } from "./pending-approval-milestone-engine.js";
import { newPendingApprovalMilestone } from "./pending-approval-milestone.js";

test("PendingApprovalMilestoneEngine keeps results within bounds", () => {
  const engine = defaultPendingApprovalMilestoneEngine();
  const item = newPendingApprovalMilestone("code-341", "title-3");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
