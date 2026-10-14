import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingPacingMapping } from "./rolling-pacing-mapping.js";

test("RollingPacingMapping starts in open", () => {
  const item = newRollingPacingMapping("code-298", "label-635");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingPacingMapping moves to in review", () => {
  const item = newRollingPacingMapping("code-298", "label-635");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("RollingPacingMapping rejects moves from archived", () => {
  const item = newRollingPacingMapping("code-298", "label-635");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
