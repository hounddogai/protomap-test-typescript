import assert from "node:assert/strict";
import { test } from "node:test";
import { newNudgeTier } from "./nudge-tier.js";

test("NudgeTier starts in idle", () => {
  const item = newNudgeTier("code-75", "name-307");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("NudgeTier moves to draining", () => {
  const item = newNudgeTier("code-75", "name-307");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("NudgeTier rejects moves from stopped", () => {
  const item = newNudgeTier("code-75", "name-307");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
