import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientExitRuleAdjustment } from "./lenient-exit-rule-adjustment.js";

test("LenientExitRuleAdjustment starts in new", () => {
  const item = newLenientExitRuleAdjustment("code-903", "title-482");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientExitRuleAdjustment moves to running", () => {
  const item = newLenientExitRuleAdjustment("code-903", "title-482");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("LenientExitRuleAdjustment rejects moves from failed", () => {
  const item = newLenientExitRuleAdjustment("code-903", "title-482");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
