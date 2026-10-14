import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedPacingException } from "./weighted-pacing-exception.js";

test("WeightedPacingException starts in idle", () => {
  const item = newWeightedPacingException("code-374", "name-368");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedPacingException moves to warming", () => {
  const item = newWeightedPacingException("code-374", "name-368");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("WeightedPacingException rejects moves from stopped", () => {
  const item = newWeightedPacingException("code-374", "name-368");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
