import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedPacingSlot } from "./weighted-pacing-slot.js";

test("WeightedPacingSlot starts in proposed", () => {
  const item = newWeightedPacingSlot("code-375", "label-825");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedPacingSlot moves to withdrawn", () => {
  const item = newWeightedPacingSlot("code-375", "label-825");
  try {
    item.moveTo("withdrawn");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "withdrawn", "status");
});

test("WeightedPacingSlot rejects moves from withdrawn", () => {
  const item = newWeightedPacingSlot("code-375", "label-825");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
