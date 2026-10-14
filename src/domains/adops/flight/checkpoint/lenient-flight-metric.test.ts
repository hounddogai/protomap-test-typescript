import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientFlightMetric } from "./lenient-flight-metric.js";

test("LenientFlightMetric starts in draft", () => {
  const item = newLenientFlightMetric("code-118", "label-734");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientFlightMetric moves to pending", () => {
  const item = newLenientFlightMetric("code-118", "label-734");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("LenientFlightMetric rejects moves from closed", () => {
  const item = newLenientFlightMetric("code-118", "label-734");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
