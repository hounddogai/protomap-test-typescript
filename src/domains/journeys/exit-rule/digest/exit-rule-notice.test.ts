import assert from "node:assert/strict";
import { test } from "node:test";
import { newExitRuleNotice } from "./exit-rule-notice.js";

test("ExitRuleNotice starts in proposed", () => {
  const item = newExitRuleNotice("code-160", "label-951");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ExitRuleNotice moves to approved", () => {
  const item = newExitRuleNotice("code-160", "label-951");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("ExitRuleNotice rejects moves from withdrawn", () => {
  const item = newExitRuleNotice("code-160", "label-951");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
