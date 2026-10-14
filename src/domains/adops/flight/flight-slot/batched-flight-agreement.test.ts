import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedFlightAgreement } from "./batched-flight-agreement.js";

test("BatchedFlightAgreement starts in open", () => {
  const item = newBatchedFlightAgreement("code-665", "name-831");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedFlightAgreement moves to resolved", () => {
  const item = newBatchedFlightAgreement("code-665", "name-831");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("BatchedFlightAgreement rejects moves from archived", () => {
  const item = newBatchedFlightAgreement("code-665", "name-831");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
