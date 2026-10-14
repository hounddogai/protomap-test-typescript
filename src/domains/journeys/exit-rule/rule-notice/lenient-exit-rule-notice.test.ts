import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientExitRuleNotice } from "./lenient-exit-rule-notice.js";

test("LenientExitRuleNotice starts in idle", () => {
  const item = newLenientExitRuleNotice("code-144", "title-19");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientExitRuleNotice moves to warming", () => {
  const item = newLenientExitRuleNotice("code-144", "title-19");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("LenientExitRuleNotice rejects moves from stopped", () => {
  const item = newLenientExitRuleNotice("code-144", "title-19");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
