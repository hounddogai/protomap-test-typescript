import assert from "node:assert/strict";
import { test } from "node:test";
import { newCreditDraft } from "./credit-draft.js";

test("CreditDraft starts in open", () => {
  const item = newCreditDraft("code-951", "title-965");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CreditDraft moves to in review", () => {
  const item = newCreditDraft("code-951", "title-965");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("CreditDraft rejects moves from archived", () => {
  const item = newCreditDraft("code-951", "title-965");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
