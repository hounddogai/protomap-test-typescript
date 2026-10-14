import assert from "node:assert/strict";
import { test } from "node:test";
import { newEscalationTarget } from "./escalation-target.js";

test("EscalationTarget starts in open", () => {
  const item = newEscalationTarget("code-295", "label-454");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("EscalationTarget moves to resolved", () => {
  const item = newEscalationTarget("code-295", "label-454");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("EscalationTarget rejects moves from archived", () => {
  const item = newEscalationTarget("code-295", "label-454");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
