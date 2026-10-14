import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryReplyBudget } from "./primary-reply-budget.js";

test("PrimaryReplyBudget starts in planned", () => {
  const item = newPrimaryReplyBudget("code-647", "title-908");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryReplyBudget moves to scheduled", () => {
  const item = newPrimaryReplyBudget("code-647", "title-908");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("PrimaryReplyBudget rejects moves from cancelled", () => {
  const item = newPrimaryReplyBudget("code-647", "title-908");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
