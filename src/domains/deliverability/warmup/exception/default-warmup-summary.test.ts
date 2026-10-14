import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultWarmupSummary } from "./default-warmup-summary.js";

test("DefaultWarmupSummary starts in new", () => {
  const item = newDefaultWarmupSummary("code-379", "label-730");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultWarmupSummary moves to running", () => {
  const item = newDefaultWarmupSummary("code-379", "label-730");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("DefaultWarmupSummary rejects moves from failed", () => {
  const item = newDefaultWarmupSummary("code-379", "label-730");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
