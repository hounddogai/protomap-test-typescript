import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryPacingEstimate } from "./primary-pacing-estimate.js";

test("PrimaryPacingEstimate starts in created", () => {
  const item = newPrimaryPacingEstimate("code-907", "title-137");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryPacingEstimate moves to retired", () => {
  const item = newPrimaryPacingEstimate("code-907", "title-137");
  try {
    item.moveTo("retired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "retired", "status");
});

test("PrimaryPacingEstimate rejects moves from retired", () => {
  const item = newPrimaryPacingEstimate("code-907", "title-137");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
