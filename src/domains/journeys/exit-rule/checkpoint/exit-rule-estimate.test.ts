import assert from "node:assert/strict";
import { test } from "node:test";
import { newExitRuleEstimate } from "./exit-rule-estimate.js";

test("ExitRuleEstimate starts in new", () => {
  const item = newExitRuleEstimate("code-153", "name-310");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ExitRuleEstimate moves to queued", () => {
  const item = newExitRuleEstimate("code-153", "name-310");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("ExitRuleEstimate rejects moves from failed", () => {
  const item = newExitRuleEstimate("code-153", "name-310");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
