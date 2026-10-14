import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedFraudCheckException } from "./weighted-fraud-check-exception.js";

test("WeightedFraudCheckException starts in proposed", () => {
  const item = newWeightedFraudCheckException("code-896", "title-817");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedFraudCheckException moves to withdrawn", () => {
  const item = newWeightedFraudCheckException("code-896", "title-817");
  try {
    item.moveTo("withdrawn");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "withdrawn", "status");
});

test("WeightedFraudCheckException rejects moves from withdrawn", () => {
  const item = newWeightedFraudCheckException("code-896", "title-817");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
