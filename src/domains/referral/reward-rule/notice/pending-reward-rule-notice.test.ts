import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingRewardRuleNotice } from "./pending-reward-rule-notice.js";

test("PendingRewardRuleNotice starts in requested", () => {
  const item = newPendingRewardRuleNotice("code-471", "name-130");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingRewardRuleNotice moves to granted", () => {
  const item = newPendingRewardRuleNotice("code-471", "name-130");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("PendingRewardRuleNotice rejects moves from expired", () => {
  const item = newPendingRewardRuleNotice("code-471", "name-130");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
