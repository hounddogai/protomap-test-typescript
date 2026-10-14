import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualEscalationLedger } from "./manual-escalation-ledger.js";

test("ManualEscalationLedger starts in requested", () => {
  const item = newManualEscalationLedger("code-913", "label-174");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualEscalationLedger moves to revoked", () => {
  const item = newManualEscalationLedger("code-913", "label-174");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("ManualEscalationLedger rejects moves from expired", () => {
  const item = newManualEscalationLedger("code-913", "label-174");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
