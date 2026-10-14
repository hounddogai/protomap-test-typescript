import assert from "node:assert/strict";
import { test } from "node:test";
import { newInsightThreshold } from "./insight-threshold.js";

test("InsightThreshold starts in idle", () => {
  const item = newInsightThreshold("code-201", "name-669");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("InsightThreshold moves to draining", () => {
  const item = newInsightThreshold("code-201", "name-669");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("InsightThreshold rejects moves from stopped", () => {
  const item = newInsightThreshold("code-201", "name-669");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
