import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingFraudCheckMapping } from "./pending-fraud-check-mapping.js";

test("PendingFraudCheckMapping starts in draft", () => {
  const item = newPendingFraudCheckMapping("code-217", "label-614");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingFraudCheckMapping moves to active", () => {
  const item = newPendingFraudCheckMapping("code-217", "label-614");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("PendingFraudCheckMapping rejects moves from closed", () => {
  const item = newPendingFraudCheckMapping("code-217", "label-614");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
