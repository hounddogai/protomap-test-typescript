import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryPacingVariance } from "./primary-pacing-variance.js";

test("PrimaryPacingVariance starts in proposed", () => {
  const item = newPrimaryPacingVariance("code-401", "name-160");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryPacingVariance moves to approved", () => {
  const item = newPrimaryPacingVariance("code-401", "name-160");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("PrimaryPacingVariance rejects moves from withdrawn", () => {
  const item = newPrimaryPacingVariance("code-401", "name-160");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
