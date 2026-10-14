import assert from "node:assert/strict";
import { test } from "node:test";
import { newFraudCheckRecord } from "./fraud-check-record.js";

test("FraudCheckRecord starts in proposed", () => {
  const item = newFraudCheckRecord("code-274", "title-619");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FraudCheckRecord moves to approved", () => {
  const item = newFraudCheckRecord("code-274", "title-619");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("FraudCheckRecord rejects moves from withdrawn", () => {
  const item = newFraudCheckRecord("code-274", "title-619");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
