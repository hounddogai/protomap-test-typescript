import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackPathMetric } from "./fallback-path-metric.js";

test("FallbackPathMetric starts in created", () => {
  const item = newFallbackPathMetric("code-443", "label-453");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackPathMetric moves to published", () => {
  const item = newFallbackPathMetric("code-443", "label-453");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("FallbackPathMetric rejects moves from retired", () => {
  const item = newFallbackPathMetric("code-443", "label-453");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
