import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedCreditDraft } from "./capped-credit-draft.js";

test("CappedCreditDraft starts in planned", () => {
  const item = newCappedCreditDraft("code-549", "title-854");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedCreditDraft moves to scheduled", () => {
  const item = newCappedCreditDraft("code-549", "title-854");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("CappedCreditDraft rejects moves from cancelled", () => {
  const item = newCappedCreditDraft("code-549", "title-854");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
