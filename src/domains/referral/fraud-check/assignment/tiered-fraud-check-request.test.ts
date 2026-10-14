import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredFraudCheckRequest } from "./tiered-fraud-check-request.js";

test("TieredFraudCheckRequest starts in new", () => {
  const item = newTieredFraudCheckRequest("code-861", "label-234");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredFraudCheckRequest moves to queued", () => {
  const item = newTieredFraudCheckRequest("code-861", "label-234");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("TieredFraudCheckRequest rejects moves from failed", () => {
  const item = newTieredFraudCheckRequest("code-861", "label-234");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
