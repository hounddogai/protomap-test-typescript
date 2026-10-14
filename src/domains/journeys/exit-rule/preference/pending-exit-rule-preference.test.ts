import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingExitRulePreference } from "./pending-exit-rule-preference.js";

test("PendingExitRulePreference starts in new", () => {
  const item = newPendingExitRulePreference("code-688", "name-516");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingExitRulePreference moves to queued", () => {
  const item = newPendingExitRulePreference("code-688", "name-516");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("PendingExitRulePreference rejects moves from failed", () => {
  const item = newPendingExitRulePreference("code-688", "name-516");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
