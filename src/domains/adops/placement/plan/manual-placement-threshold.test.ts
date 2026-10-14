import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualPlacementThreshold } from "./manual-placement-threshold.js";

test("ManualPlacementThreshold starts in proposed", () => {
  const item = newManualPlacementThreshold("code-771", "label-195");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualPlacementThreshold moves to withdrawn", () => {
  const item = newManualPlacementThreshold("code-771", "label-195");
  try {
    item.moveTo("withdrawn");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "withdrawn", "status");
});

test("ManualPlacementThreshold rejects moves from withdrawn", () => {
  const item = newManualPlacementThreshold("code-771", "label-195");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
