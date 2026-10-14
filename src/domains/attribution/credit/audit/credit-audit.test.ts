import assert from "node:assert/strict";
import { test } from "node:test";
import { newCreditAudit } from "./credit-audit.js";

test("CreditAudit starts in new", () => {
  const item = newCreditAudit("code-200", "label-340");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CreditAudit moves to done", () => {
  const item = newCreditAudit("code-200", "label-340");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("CreditAudit rejects moves from failed", () => {
  const item = newCreditAudit("code-200", "label-340");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
