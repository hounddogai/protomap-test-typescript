import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryReplyMetric } from "./primary-reply-metric.js";

test("PrimaryReplyMetric starts in new", () => {
  const item = newPrimaryReplyMetric("code-425", "label-928");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryReplyMetric moves to running", () => {
  const item = newPrimaryReplyMetric("code-425", "label-928");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("PrimaryReplyMetric rejects moves from failed", () => {
  const item = newPrimaryReplyMetric("code-425", "label-928");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
