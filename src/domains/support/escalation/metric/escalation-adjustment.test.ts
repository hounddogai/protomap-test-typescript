import assert from "node:assert/strict";
import { test } from "node:test";
import { newEscalationAdjustment } from "./escalation-adjustment.js";

test("EscalationAdjustment starts in idle", () => {
  const item = newEscalationAdjustment("code-998", "name-478");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("EscalationAdjustment moves to warming", () => {
  const item = newEscalationAdjustment("code-998", "name-478");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("EscalationAdjustment rejects moves from stopped", () => {
  const item = newEscalationAdjustment("code-998", "name-478");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
