import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedFraudCheckException } from "./capped-fraud-check-exception.js";

test("CappedFraudCheckException starts in proposed", () => {
  const item = newCappedFraudCheckException("code-910", "title-709");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedFraudCheckException moves to approved", () => {
  const item = newCappedFraudCheckException("code-910", "title-709");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("CappedFraudCheckException rejects moves from withdrawn", () => {
  const item = newCappedFraudCheckException("code-910", "title-709");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
