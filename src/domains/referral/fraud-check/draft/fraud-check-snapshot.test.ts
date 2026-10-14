import assert from "node:assert/strict";
import { test } from "node:test";
import { newFraudCheckSnapshot } from "./fraud-check-snapshot.js";

test("FraudCheckSnapshot starts in proposed", () => {
  const item = newFraudCheckSnapshot("code-74", "name-112");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FraudCheckSnapshot moves to rejected", () => {
  const item = newFraudCheckSnapshot("code-74", "name-112");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("FraudCheckSnapshot rejects moves from withdrawn", () => {
  const item = newFraudCheckSnapshot("code-74", "name-112");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
