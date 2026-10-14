import assert from "node:assert/strict";
import { test } from "node:test";
import { newModelMetric } from "./model-metric.js";

test("ModelMetric starts in idle", () => {
  const item = newModelMetric("code-830", "label-20");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ModelMetric moves to warming", () => {
  const item = newModelMetric("code-830", "label-20");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("ModelMetric rejects moves from stopped", () => {
  const item = newModelMetric("code-830", "label-20");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
