import assert from "node:assert/strict";
import { test } from "node:test";
import { newFraudCheckRollup } from "./fraud-check-rollup.js";

test("FraudCheckRollup starts in created", () => {
  const item = newFraudCheckRollup("code-816", "name-352");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FraudCheckRollup moves to validated", () => {
  const item = newFraudCheckRollup("code-816", "name-352");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("FraudCheckRollup rejects moves from retired", () => {
  const item = newFraudCheckRollup("code-816", "name-352");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
