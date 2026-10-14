import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalBidRuleNotice } from "./global-bid-rule-notice.js";

test("GlobalBidRuleNotice starts in idle", () => {
  const item = newGlobalBidRuleNotice("code-68", "name-318");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalBidRuleNotice moves to stopped", () => {
  const item = newGlobalBidRuleNotice("code-68", "name-318");
  try {
    item.moveTo("stopped");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "stopped", "status");
});

test("GlobalBidRuleNotice rejects moves from stopped", () => {
  const item = newGlobalBidRuleNotice("code-68", "name-318");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
