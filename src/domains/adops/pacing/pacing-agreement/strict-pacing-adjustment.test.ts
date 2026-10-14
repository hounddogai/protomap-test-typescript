import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictPacingAdjustment } from "./strict-pacing-adjustment.js";

test("StrictPacingAdjustment starts in open", () => {
  const item = newStrictPacingAdjustment("code-513", "name-827");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictPacingAdjustment moves to in review", () => {
  const item = newStrictPacingAdjustment("code-513", "name-827");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("StrictPacingAdjustment rejects moves from archived", () => {
  const item = newStrictPacingAdjustment("code-513", "name-827");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
