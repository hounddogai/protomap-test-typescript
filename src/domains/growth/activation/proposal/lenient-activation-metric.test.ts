import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientActivationMetric } from "./lenient-activation-metric.js";

test("LenientActivationMetric starts in new", () => {
  const item = newLenientActivationMetric("code-437", "name-827");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientActivationMetric moves to running", () => {
  const item = newLenientActivationMetric("code-437", "name-827");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("LenientActivationMetric rejects moves from failed", () => {
  const item = newLenientActivationMetric("code-437", "name-827");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
