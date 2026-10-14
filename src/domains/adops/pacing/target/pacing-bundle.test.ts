import assert from "node:assert/strict";
import { test } from "node:test";
import { newPacingBundle } from "./pacing-bundle.js";

test("PacingBundle starts in idle", () => {
  const item = newPacingBundle("code-694", "label-822");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PacingBundle moves to draining", () => {
  const item = newPacingBundle("code-694", "label-822");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("PacingBundle rejects moves from stopped", () => {
  const item = newPacingBundle("code-694", "label-822");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
