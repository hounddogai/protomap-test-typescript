import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackEscalationSummary } from "./fallback-escalation-summary.js";

test("FallbackEscalationSummary starts in idle", () => {
  const item = newFallbackEscalationSummary("code-299", "name-321");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackEscalationSummary moves to ready", () => {
  const item = newFallbackEscalationSummary("code-299", "name-321");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("FallbackEscalationSummary rejects moves from stopped", () => {
  const item = newFallbackEscalationSummary("code-299", "name-321");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
