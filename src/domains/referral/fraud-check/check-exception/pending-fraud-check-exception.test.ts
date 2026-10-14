import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingFraudCheckException } from "./pending-fraud-check-exception.js";

test("PendingFraudCheckException starts in requested", () => {
  const item = newPendingFraudCheckException("code-445", "label-599");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingFraudCheckException moves to revoked", () => {
  const item = newPendingFraudCheckException("code-445", "label-599");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("PendingFraudCheckException rejects moves from expired", () => {
  const item = newPendingFraudCheckException("code-445", "label-599");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
