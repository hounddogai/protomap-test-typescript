import assert from "node:assert/strict";
import { test } from "node:test";
import { newInsightScore } from "./insight-score.js";

test("InsightScore starts in idle", () => {
  const item = newInsightScore("code-299", "title-480");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("InsightScore moves to draining", () => {
  const item = newInsightScore("code-299", "title-480");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("InsightScore rejects moves from stopped", () => {
  const item = newInsightScore("code-299", "title-480");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
