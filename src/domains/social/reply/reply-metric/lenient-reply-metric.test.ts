import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientReplyMetric } from "./lenient-reply-metric.js";

test("LenientReplyMetric starts in idle", () => {
  const item = newLenientReplyMetric("code-630", "name-714");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientReplyMetric moves to ready", () => {
  const item = newLenientReplyMetric("code-630", "name-714");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("LenientReplyMetric rejects moves from stopped", () => {
  const item = newLenientReplyMetric("code-630", "name-714");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
