import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalRedemptionLedger } from "./global-redemption-ledger.js";

test("GlobalRedemptionLedger starts in idle", () => {
  const item = newGlobalRedemptionLedger("code-859", "label-934");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalRedemptionLedger moves to warming", () => {
  const item = newGlobalRedemptionLedger("code-859", "label-934");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("GlobalRedemptionLedger rejects moves from stopped", () => {
  const item = newGlobalRedemptionLedger("code-859", "label-934");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
