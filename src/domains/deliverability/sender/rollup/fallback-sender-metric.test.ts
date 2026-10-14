import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackSenderMetric } from "./fallback-sender-metric.js";

test("FallbackSenderMetric starts in new", () => {
  const item = newFallbackSenderMetric("code-943", "label-375");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackSenderMetric moves to queued", () => {
  const item = newFallbackSenderMetric("code-943", "label-375");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("FallbackSenderMetric rejects moves from failed", () => {
  const item = newFallbackSenderMetric("code-943", "label-375");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
