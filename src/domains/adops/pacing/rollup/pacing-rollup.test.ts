import assert from "node:assert/strict";
import { test } from "node:test";
import { newPacingRollup } from "./pacing-rollup.js";

test("PacingRollup starts in new", () => {
  const item = newPacingRollup("code-424", "title-127");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PacingRollup moves to running", () => {
  const item = newPacingRollup("code-424", "title-127");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("PacingRollup rejects moves from failed", () => {
  const item = newPacingRollup("code-424", "title-127");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
