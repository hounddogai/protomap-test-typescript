import assert from "node:assert/strict";
import { test } from "node:test";
import { newCreditNotice } from "./credit-notice.js";

test("CreditNotice starts in draft", () => {
  const item = newCreditNotice("code-155", "label-493");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CreditNotice moves to active", () => {
  const item = newCreditNotice("code-155", "label-493");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("CreditNotice rejects moves from closed", () => {
  const item = newCreditNotice("code-155", "label-493");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
