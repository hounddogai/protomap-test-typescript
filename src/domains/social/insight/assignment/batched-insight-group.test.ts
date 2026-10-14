import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedInsightGroup } from "./batched-insight-group.js";

test("BatchedInsightGroup starts in open", () => {
  const item = newBatchedInsightGroup("code-943", "label-484");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedInsightGroup moves to reopened", () => {
  const item = newBatchedInsightGroup("code-943", "label-484");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("BatchedInsightGroup rejects moves from archived", () => {
  const item = newBatchedInsightGroup("code-943", "label-484");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
