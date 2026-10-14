import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedDeflectionAssignment } from "./weighted-deflection-assignment.js";

test("WeightedDeflectionAssignment starts in requested", () => {
  const item = newWeightedDeflectionAssignment("code-995", "label-64");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedDeflectionAssignment moves to expired", () => {
  const item = newWeightedDeflectionAssignment("code-995", "label-64");
  try {
    item.moveTo("expired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "expired", "status");
});

test("WeightedDeflectionAssignment rejects moves from expired", () => {
  const item = newWeightedDeflectionAssignment("code-995", "label-64");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
