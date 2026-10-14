import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingFraudCheckSnapshot } from "./pending-fraud-check-snapshot.js";

test("PendingFraudCheckSnapshot starts in proposed", () => {
  const item = newPendingFraudCheckSnapshot("code-833", "label-355");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingFraudCheckSnapshot moves to approved", () => {
  const item = newPendingFraudCheckSnapshot("code-833", "label-355");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("PendingFraudCheckSnapshot rejects moves from withdrawn", () => {
  const item = newPendingFraudCheckSnapshot("code-833", "label-355");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
