import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledExitRuleNotice } from "./scheduled-exit-rule-notice.js";

test("ScheduledExitRuleNotice starts in proposed", () => {
  const item = newScheduledExitRuleNotice("code-37", "label-224");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledExitRuleNotice moves to rejected", () => {
  const item = newScheduledExitRuleNotice("code-37", "label-224");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("ScheduledExitRuleNotice rejects moves from withdrawn", () => {
  const item = newScheduledExitRuleNotice("code-37", "label-224");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
