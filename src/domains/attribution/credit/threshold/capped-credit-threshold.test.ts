import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedCreditThreshold } from "./capped-credit-threshold.js";

test("CappedCreditThreshold starts in open", () => {
  const item = newCappedCreditThreshold("code-858", "title-394");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedCreditThreshold moves to in review", () => {
  const item = newCappedCreditThreshold("code-858", "title-394");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("CappedCreditThreshold rejects moves from archived", () => {
  const item = newCappedCreditThreshold("code-858", "title-394");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
