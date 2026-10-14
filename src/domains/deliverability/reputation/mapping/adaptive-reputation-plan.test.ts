import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveReputationPlan } from "./adaptive-reputation-plan.js";

test("AdaptiveReputationPlan starts in proposed", () => {
  const item = newAdaptiveReputationPlan("code-700", "name-817");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveReputationPlan moves to rejected", () => {
  const item = newAdaptiveReputationPlan("code-700", "name-817");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("AdaptiveReputationPlan rejects moves from withdrawn", () => {
  const item = newAdaptiveReputationPlan("code-700", "name-817");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
