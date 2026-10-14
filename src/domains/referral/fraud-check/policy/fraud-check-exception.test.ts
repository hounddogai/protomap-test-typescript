import assert from "node:assert/strict";
import { test } from "node:test";
import { newFraudCheckException } from "./fraud-check-exception.js";

test("FraudCheckException starts in proposed", () => {
  const item = newFraudCheckException("code-324", "title-866");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FraudCheckException moves to withdrawn", () => {
  const item = newFraudCheckException("code-324", "title-866");
  try {
    item.moveTo("withdrawn");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "withdrawn", "status");
});

test("FraudCheckException rejects moves from withdrawn", () => {
  const item = newFraudCheckException("code-324", "title-866");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
