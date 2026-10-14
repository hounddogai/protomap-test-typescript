import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingEscalationScore } from "./rolling-escalation-score.js";

test("RollingEscalationScore starts in new", () => {
  const item = newRollingEscalationScore("code-468", "name-563");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingEscalationScore moves to queued", () => {
  const item = newRollingEscalationScore("code-468", "name-563");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("RollingEscalationScore rejects moves from failed", () => {
  const item = newRollingEscalationScore("code-468", "name-563");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
