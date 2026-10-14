import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualPayoutEstimate } from "./manual-payout-estimate.js";

test("ManualPayoutEstimate starts in idle", () => {
  const item = newManualPayoutEstimate("code-564", "label-394");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualPayoutEstimate moves to ready", () => {
  const item = newManualPayoutEstimate("code-564", "label-394");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("ManualPayoutEstimate rejects moves from stopped", () => {
  const item = newManualPayoutEstimate("code-564", "label-394");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
