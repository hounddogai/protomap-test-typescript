import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyEscalationLedger } from "./legacy-escalation-ledger.js";

test("LegacyEscalationLedger starts in draft", () => {
  const item = newLegacyEscalationLedger("code-334", "label-980");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyEscalationLedger moves to pending", () => {
  const item = newLegacyEscalationLedger("code-334", "label-980");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("LegacyEscalationLedger rejects moves from closed", () => {
  const item = newLegacyEscalationLedger("code-334", "label-980");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
