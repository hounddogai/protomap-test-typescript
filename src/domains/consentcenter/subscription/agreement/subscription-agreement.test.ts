import assert from "node:assert/strict";
import { test } from "node:test";
import { newSubscriptionAgreement } from "./subscription-agreement.js";

test("SubscriptionAgreement starts in open", () => {
  const item = newSubscriptionAgreement("code-478", "title-633");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SubscriptionAgreement moves to resolved", () => {
  const item = newSubscriptionAgreement("code-478", "title-633");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("SubscriptionAgreement rejects moves from archived", () => {
  const item = newSubscriptionAgreement("code-478", "title-633");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
