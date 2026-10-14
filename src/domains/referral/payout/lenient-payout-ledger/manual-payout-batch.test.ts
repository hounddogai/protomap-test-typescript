import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualPayoutBatch } from "./manual-payout-batch.js";

test("ManualPayoutBatch starts in draft", () => {
  const item = newManualPayoutBatch("code-658", "title-76");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualPayoutBatch moves to closed", () => {
  const item = newManualPayoutBatch("code-658", "title-76");
  try {
    item.moveTo("closed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "closed", "status");
});

test("ManualPayoutBatch rejects moves from closed", () => {
  const item = newManualPayoutBatch("code-658", "title-76");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
