import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptivePacingBaseline } from "./adaptive-pacing-baseline.js";

test("AdaptivePacingBaseline starts in idle", () => {
  const item = newAdaptivePacingBaseline("code-702", "title-812");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptivePacingBaseline moves to warming", () => {
  const item = newAdaptivePacingBaseline("code-702", "title-812");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("AdaptivePacingBaseline rejects moves from stopped", () => {
  const item = newAdaptivePacingBaseline("code-702", "title-812");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
