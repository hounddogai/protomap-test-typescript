import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyPacingPlan } from "./legacy-pacing-plan.js";

test("LegacyPacingPlan starts in idle", () => {
  const item = newLegacyPacingPlan("code-309", "label-911");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyPacingPlan moves to ready", () => {
  const item = newLegacyPacingPlan("code-309", "label-911");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("LegacyPacingPlan rejects moves from stopped", () => {
  const item = newLegacyPacingPlan("code-309", "label-911");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
