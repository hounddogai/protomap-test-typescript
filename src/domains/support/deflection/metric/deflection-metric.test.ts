import assert from "node:assert/strict";
import { test } from "node:test";
import { newDeflectionMetric } from "./deflection-metric.js";

test("DeflectionMetric starts in new", () => {
  const item = newDeflectionMetric("code-361", "label-933");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DeflectionMetric moves to running", () => {
  const item = newDeflectionMetric("code-361", "label-933");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("DeflectionMetric rejects moves from failed", () => {
  const item = newDeflectionMetric("code-361", "label-933");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
