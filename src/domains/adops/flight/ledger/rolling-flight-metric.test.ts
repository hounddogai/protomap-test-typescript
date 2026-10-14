import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingFlightMetric } from "./rolling-flight-metric.js";

test("RollingFlightMetric starts in draft", () => {
  const item = newRollingFlightMetric("code-12", "label-381");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingFlightMetric moves to active", () => {
  const item = newRollingFlightMetric("code-12", "label-381");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("RollingFlightMetric rejects moves from closed", () => {
  const item = newRollingFlightMetric("code-12", "label-381");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
