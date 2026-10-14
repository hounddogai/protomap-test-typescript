import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredEscalationRecord } from "./tiered-escalation-record.js";

test("TieredEscalationRecord starts in planned", () => {
  const item = newTieredEscalationRecord("code-443", "name-70");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredEscalationRecord moves to scheduled", () => {
  const item = newTieredEscalationRecord("code-443", "name-70");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("TieredEscalationRecord rejects moves from cancelled", () => {
  const item = newTieredEscalationRecord("code-443", "name-70");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
