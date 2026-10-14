import assert from "node:assert/strict";
import { test } from "node:test";
import { newFraudCheckPolicy } from "./fraud-check-policy.js";

test("FraudCheckPolicy starts in requested", () => {
  const item = newFraudCheckPolicy("code-866", "title-268");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FraudCheckPolicy moves to granted", () => {
  const item = newFraudCheckPolicy("code-866", "title-268");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("FraudCheckPolicy rejects moves from expired", () => {
  const item = newFraudCheckPolicy("code-866", "title-268");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
