import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictReplyBudget } from "./strict-reply-budget.js";

test("StrictReplyBudget starts in requested", () => {
  const item = newStrictReplyBudget("code-320", "label-305");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictReplyBudget moves to revoked", () => {
  const item = newStrictReplyBudget("code-320", "label-305");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("StrictReplyBudget rejects moves from expired", () => {
  const item = newStrictReplyBudget("code-320", "label-305");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
