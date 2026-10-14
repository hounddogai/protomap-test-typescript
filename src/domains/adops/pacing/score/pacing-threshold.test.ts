import assert from "node:assert/strict";
import { test } from "node:test";
import { newPacingThreshold } from "./pacing-threshold.js";

test("PacingThreshold starts in created", () => {
  const item = newPacingThreshold("code-427", "name-537");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PacingThreshold moves to published", () => {
  const item = newPacingThreshold("code-427", "name-537");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("PacingThreshold rejects moves from retired", () => {
  const item = newPacingThreshold("code-427", "name-537");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
