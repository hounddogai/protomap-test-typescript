import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryInsightPlan } from "./primary-insight-plan.js";

test("PrimaryInsightPlan starts in proposed", () => {
  const item = newPrimaryInsightPlan("code-228", "title-721");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryInsightPlan moves to withdrawn", () => {
  const item = newPrimaryInsightPlan("code-228", "title-721");
  try {
    item.moveTo("withdrawn");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "withdrawn", "status");
});

test("PrimaryInsightPlan rejects moves from withdrawn", () => {
  const item = newPrimaryInsightPlan("code-228", "title-721");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
