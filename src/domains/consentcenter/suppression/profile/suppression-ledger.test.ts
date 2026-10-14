import assert from "node:assert/strict";
import { test } from "node:test";
import { newSuppressionLedger } from "./suppression-ledger.js";

test("SuppressionLedger starts in planned", () => {
  const item = newSuppressionLedger("code-568", "label-752");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SuppressionLedger moves to cancelled", () => {
  const item = newSuppressionLedger("code-568", "label-752");
  try {
    item.moveTo("cancelled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "cancelled", "status");
});

test("SuppressionLedger rejects moves from cancelled", () => {
  const item = newSuppressionLedger("code-568", "label-752");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
