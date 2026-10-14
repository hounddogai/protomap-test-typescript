import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedCsatMetric } from "./capped-csat-metric.js";

test("CappedCsatMetric starts in draft", () => {
  const item = newCappedCsatMetric("code-150", "name-426");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedCsatMetric moves to pending", () => {
  const item = newCappedCsatMetric("code-150", "name-426");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("CappedCsatMetric rejects moves from closed", () => {
  const item = newCappedCsatMetric("code-150", "name-426");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
