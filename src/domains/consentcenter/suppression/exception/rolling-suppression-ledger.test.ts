import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingSuppressionLedger } from "./rolling-suppression-ledger.js";

test("RollingSuppressionLedger starts in planned", () => {
  const item = newRollingSuppressionLedger("code-922", "label-475");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingSuppressionLedger moves to cancelled", () => {
  const item = newRollingSuppressionLedger("code-922", "label-475");
  try {
    item.moveTo("cancelled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "cancelled", "status");
});

test("RollingSuppressionLedger rejects moves from cancelled", () => {
  const item = newRollingSuppressionLedger("code-922", "label-475");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
