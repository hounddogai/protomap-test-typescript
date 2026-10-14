import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedPlacementPreference } from "./batched-placement-preference.js";

test("BatchedPlacementPreference starts in open", () => {
  const item = newBatchedPlacementPreference("code-376", "name-280");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedPlacementPreference moves to reopened", () => {
  const item = newBatchedPlacementPreference("code-376", "name-280");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("BatchedPlacementPreference rejects moves from archived", () => {
  const item = newBatchedPlacementPreference("code-376", "name-280");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
