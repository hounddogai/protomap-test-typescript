import assert from "node:assert/strict";
import { test } from "node:test";
import { newFraudCheckGroup } from "./fraud-check-group.js";

test("FraudCheckGroup starts in proposed", () => {
  const item = newFraudCheckGroup("code-232", "title-242");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FraudCheckGroup moves to approved", () => {
  const item = newFraudCheckGroup("code-232", "title-242");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("FraudCheckGroup rejects moves from withdrawn", () => {
  const item = newFraudCheckGroup("code-232", "title-242");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
