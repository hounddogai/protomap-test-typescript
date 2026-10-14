import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalSuppressionVariance } from "./global-suppression-variance.js";

test("GlobalSuppressionVariance starts in planned", () => {
  const item = newGlobalSuppressionVariance("code-997", "label-826");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalSuppressionVariance moves to scheduled", () => {
  const item = newGlobalSuppressionVariance("code-997", "label-826");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("GlobalSuppressionVariance rejects moves from cancelled", () => {
  const item = newGlobalSuppressionVariance("code-997", "label-826");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
