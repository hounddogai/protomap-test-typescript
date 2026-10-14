import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalSuppressionAllocation } from "./global-suppression-allocation.js";

test("GlobalSuppressionAllocation starts in draft", () => {
  const item = newGlobalSuppressionAllocation("code-88", "title-781");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalSuppressionAllocation moves to suspended", () => {
  const item = newGlobalSuppressionAllocation("code-88", "title-781");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("GlobalSuppressionAllocation rejects moves from closed", () => {
  const item = newGlobalSuppressionAllocation("code-88", "title-781");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
