import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalPacingSlot } from "./regional-pacing-slot.js";

test("RegionalPacingSlot starts in idle", () => {
  const item = newRegionalPacingSlot("code-653", "label-216");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalPacingSlot moves to stopped", () => {
  const item = newRegionalPacingSlot("code-653", "label-216");
  try {
    item.moveTo("stopped");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "stopped", "status");
});

test("RegionalPacingSlot rejects moves from stopped", () => {
  const item = newRegionalPacingSlot("code-653", "label-216");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
