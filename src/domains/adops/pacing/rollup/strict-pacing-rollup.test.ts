import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictPacingRollup } from "./strict-pacing-rollup.js";

test("StrictPacingRollup starts in idle", () => {
  const item = newStrictPacingRollup("code-690", "title-585");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictPacingRollup moves to warming", () => {
  const item = newStrictPacingRollup("code-690", "title-585");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("StrictPacingRollup rejects moves from stopped", () => {
  const item = newStrictPacingRollup("code-690", "title-585");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
