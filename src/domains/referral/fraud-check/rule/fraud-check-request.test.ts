import assert from "node:assert/strict";
import { test } from "node:test";
import { newFraudCheckRequest } from "./fraud-check-request.js";

test("FraudCheckRequest starts in draft", () => {
  const item = newFraudCheckRequest("code-873", "label-551");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FraudCheckRequest moves to pending", () => {
  const item = newFraudCheckRequest("code-873", "label-551");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("FraudCheckRequest rejects moves from closed", () => {
  const item = newFraudCheckRequest("code-873", "label-551");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
