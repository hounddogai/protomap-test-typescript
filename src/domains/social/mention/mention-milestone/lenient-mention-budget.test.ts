import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientMentionBudget } from "./lenient-mention-budget.js";

test("LenientMentionBudget starts in proposed", () => {
  const item = newLenientMentionBudget("code-861", "title-451");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientMentionBudget moves to approved", () => {
  const item = newLenientMentionBudget("code-861", "title-451");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("LenientMentionBudget rejects moves from withdrawn", () => {
  const item = newLenientMentionBudget("code-861", "title-451");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
