import assert from "node:assert/strict";
import { test } from "node:test";
import { newInsightAllocation } from "./insight-allocation.js";

test("InsightAllocation starts in idle", () => {
  const item = newInsightAllocation("code-429", "name-639");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("InsightAllocation moves to warming", () => {
  const item = newInsightAllocation("code-429", "name-639");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("InsightAllocation rejects moves from stopped", () => {
  const item = newInsightAllocation("code-429", "name-639");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
