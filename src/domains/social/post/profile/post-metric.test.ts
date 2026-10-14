import assert from "node:assert/strict";
import { test } from "node:test";
import { newPostMetric } from "./post-metric.js";

test("PostMetric starts in idle", () => {
  const item = newPostMetric("code-65", "label-682");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PostMetric moves to warming", () => {
  const item = newPostMetric("code-65", "label-682");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("PostMetric rejects moves from stopped", () => {
  const item = newPostMetric("code-65", "label-682");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
