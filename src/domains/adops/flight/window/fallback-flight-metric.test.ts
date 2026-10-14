import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackFlightMetric } from "./fallback-flight-metric.js";

test("FallbackFlightMetric starts in idle", () => {
  const item = newFallbackFlightMetric("code-286", "label-296");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackFlightMetric moves to warming", () => {
  const item = newFallbackFlightMetric("code-286", "label-296");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("FallbackFlightMetric rejects moves from stopped", () => {
  const item = newFallbackFlightMetric("code-286", "label-296");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
