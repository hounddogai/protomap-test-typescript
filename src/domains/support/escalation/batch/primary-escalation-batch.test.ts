import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryEscalationBatch } from "./primary-escalation-batch.js";

test("PrimaryEscalationBatch starts in idle", () => {
  const item = newPrimaryEscalationBatch("code-289", "title-235");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryEscalationBatch moves to draining", () => {
  const item = newPrimaryEscalationBatch("code-289", "title-235");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("PrimaryEscalationBatch rejects moves from stopped", () => {
  const item = newPrimaryEscalationBatch("code-289", "title-235");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
