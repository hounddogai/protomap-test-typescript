import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingInsightPlan } from "./pending-insight-plan.js";

test("PendingInsightPlan starts in proposed", () => {
  const item = newPendingInsightPlan("code-692", "name-58");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingInsightPlan moves to withdrawn", () => {
  const item = newPendingInsightPlan("code-692", "name-58");
  try {
    item.moveTo("withdrawn");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "withdrawn", "status");
});

test("PendingInsightPlan rejects moves from withdrawn", () => {
  const item = newPendingInsightPlan("code-692", "name-58");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
