import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingExitRuleItem } from "./pending-exit-rule-item.js";

test("PendingExitRuleItem starts in open", () => {
  const item = newPendingExitRuleItem("code-741", "label-488");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingExitRuleItem moves to archived", () => {
  const item = newPendingExitRuleItem("code-741", "label-488");
  try {
    item.moveTo("archived");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "archived", "status");
});

test("PendingExitRuleItem rejects moves from archived", () => {
  const item = newPendingExitRuleItem("code-741", "label-488");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
