import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedPlacementTemplate } from "./batched-placement-template.js";

test("BatchedPlacementTemplate starts in new", () => {
  const item = newBatchedPlacementTemplate("code-837", "label-233");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedPlacementTemplate moves to queued", () => {
  const item = newBatchedPlacementTemplate("code-837", "label-233");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("BatchedPlacementTemplate rejects moves from failed", () => {
  const item = newBatchedPlacementTemplate("code-837", "label-233");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
