import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyEscalationBatch } from "./legacy-escalation-batch.js";

test("LegacyEscalationBatch starts in proposed", () => {
  const item = newLegacyEscalationBatch("code-628", "name-97");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyEscalationBatch moves to rejected", () => {
  const item = newLegacyEscalationBatch("code-628", "name-97");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("LegacyEscalationBatch rejects moves from withdrawn", () => {
  const item = newLegacyEscalationBatch("code-628", "name-97");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
