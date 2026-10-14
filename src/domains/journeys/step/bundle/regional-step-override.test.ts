import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalStepOverride } from "./regional-step-override.js";

test("RegionalStepOverride starts in idle", () => {
  const item = newRegionalStepOverride("code-123", "label-711");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalStepOverride moves to warming", () => {
  const item = newRegionalStepOverride("code-123", "label-711");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("RegionalStepOverride rejects moves from stopped", () => {
  const item = newRegionalStepOverride("code-123", "label-711");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
