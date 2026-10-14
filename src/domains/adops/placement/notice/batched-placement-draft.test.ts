import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedPlacementDraft } from "./batched-placement-draft.js";

test("BatchedPlacementDraft starts in new", () => {
  const item = newBatchedPlacementDraft("code-566", "label-801");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedPlacementDraft moves to queued", () => {
  const item = newBatchedPlacementDraft("code-566", "label-801");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("BatchedPlacementDraft rejects moves from failed", () => {
  const item = newBatchedPlacementDraft("code-566", "label-801");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
