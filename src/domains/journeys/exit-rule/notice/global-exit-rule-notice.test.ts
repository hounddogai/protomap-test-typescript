import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalExitRuleNotice } from "./global-exit-rule-notice.js";

test("GlobalExitRuleNotice starts in open", () => {
  const item = newGlobalExitRuleNotice("code-334", "title-984");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalExitRuleNotice moves to in review", () => {
  const item = newGlobalExitRuleNotice("code-334", "title-984");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("GlobalExitRuleNotice rejects moves from archived", () => {
  const item = newGlobalExitRuleNotice("code-334", "title-984");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
