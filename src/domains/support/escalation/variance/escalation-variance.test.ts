import assert from "node:assert/strict";
import { test } from "node:test";
import { newEscalationVariance } from "./escalation-variance.js";

test("EscalationVariance starts in idle", () => {
  const item = newEscalationVariance("code-545", "title-978");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("EscalationVariance moves to ready", () => {
  const item = newEscalationVariance("code-545", "title-978");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("EscalationVariance rejects moves from stopped", () => {
  const item = newEscalationVariance("code-545", "title-978");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
