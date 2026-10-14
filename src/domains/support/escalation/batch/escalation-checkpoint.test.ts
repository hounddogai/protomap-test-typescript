import assert from "node:assert/strict";
import { test } from "node:test";
import { newEscalationCheckpoint } from "./escalation-checkpoint.js";

test("EscalationCheckpoint starts in planned", () => {
  const item = newEscalationCheckpoint("code-595", "label-679");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("EscalationCheckpoint moves to scheduled", () => {
  const item = newEscalationCheckpoint("code-595", "label-679");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("EscalationCheckpoint rejects moves from cancelled", () => {
  const item = newEscalationCheckpoint("code-595", "label-679");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
