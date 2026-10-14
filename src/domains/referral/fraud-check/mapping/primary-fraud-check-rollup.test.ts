import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryFraudCheckRollup } from "./primary-fraud-check-rollup.js";

test("PrimaryFraudCheckRollup starts in draft", () => {
  const item = newPrimaryFraudCheckRollup("code-681", "label-440");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryFraudCheckRollup moves to pending", () => {
  const item = newPrimaryFraudCheckRollup("code-681", "label-440");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("PrimaryFraudCheckRollup rejects moves from closed", () => {
  const item = newPrimaryFraudCheckRollup("code-681", "label-440");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
