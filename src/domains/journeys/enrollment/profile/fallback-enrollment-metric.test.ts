import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackEnrollmentMetric } from "./fallback-enrollment-metric.js";

test("FallbackEnrollmentMetric starts in open", () => {
  const item = newFallbackEnrollmentMetric("code-317", "name-656");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackEnrollmentMetric moves to resolved", () => {
  const item = newFallbackEnrollmentMetric("code-317", "name-656");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("FallbackEnrollmentMetric rejects moves from archived", () => {
  const item = newFallbackEnrollmentMetric("code-317", "name-656");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
