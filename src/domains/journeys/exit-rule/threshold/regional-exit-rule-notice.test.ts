import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalExitRuleNotice } from "./regional-exit-rule-notice.js";

test("RegionalExitRuleNotice starts in new", () => {
  const item = newRegionalExitRuleNotice("code-380", "title-116");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalExitRuleNotice moves to failed", () => {
  const item = newRegionalExitRuleNotice("code-380", "title-116");
  try {
    item.moveTo("failed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "failed", "status");
});

test("RegionalExitRuleNotice rejects moves from failed", () => {
  const item = newRegionalExitRuleNotice("code-380", "title-116");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
