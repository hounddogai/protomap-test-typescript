import assert from "node:assert/strict";
import { test } from "node:test";
import { newFraudCheckTarget } from "./fraud-check-target.js";

test("FraudCheckTarget starts in draft", () => {
  const item = newFraudCheckTarget("code-2", "name-459");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FraudCheckTarget moves to pending", () => {
  const item = newFraudCheckTarget("code-2", "name-459");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("FraudCheckTarget rejects moves from closed", () => {
  const item = newFraudCheckTarget("code-2", "name-459");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
