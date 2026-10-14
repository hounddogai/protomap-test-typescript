import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientWindowMetric } from "./lenient-window-metric.js";

test("LenientWindowMetric starts in created", () => {
  const item = newLenientWindowMetric("code-892", "label-425");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientWindowMetric moves to validated", () => {
  const item = newLenientWindowMetric("code-892", "label-425");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("LenientWindowMetric rejects moves from retired", () => {
  const item = newLenientWindowMetric("code-892", "label-425");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
