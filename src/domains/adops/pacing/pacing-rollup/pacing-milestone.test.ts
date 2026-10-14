import assert from "node:assert/strict";
import { test } from "node:test";
import { newPacingMilestone } from "./pacing-milestone.js";

test("PacingMilestone starts in proposed", () => {
  const item = newPacingMilestone("code-542", "name-511");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PacingMilestone moves to rejected", () => {
  const item = newPacingMilestone("code-542", "name-511");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("PacingMilestone rejects moves from withdrawn", () => {
  const item = newPacingMilestone("code-542", "name-511");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
