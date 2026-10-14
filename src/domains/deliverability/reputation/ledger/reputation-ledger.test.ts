import assert from "node:assert/strict";
import { test } from "node:test";
import { newReputationLedger } from "./reputation-ledger.js";

test("ReputationLedger starts in new", () => {
  const item = newReputationLedger("code-288", "label-869");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ReputationLedger moves to queued", () => {
  const item = newReputationLedger("code-288", "label-869");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("ReputationLedger rejects moves from failed", () => {
  const item = newReputationLedger("code-288", "label-869");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
