import assert from "node:assert/strict";
import { test } from "node:test";
import { newPacingEstimate } from "./pacing-estimate.js";

test("PacingEstimate starts in created", () => {
  const item = newPacingEstimate("code-555", "name-370");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PacingEstimate moves to validated", () => {
  const item = newPacingEstimate("code-555", "name-370");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("PacingEstimate rejects moves from retired", () => {
  const item = newPacingEstimate("code-555", "name-370");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
