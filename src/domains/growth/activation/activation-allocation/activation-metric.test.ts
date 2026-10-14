import assert from "node:assert/strict";
import { test } from "node:test";
import { newActivationMetric } from "./activation-metric.js";

test("ActivationMetric starts in new", () => {
  const item = newActivationMetric("code-693", "name-91");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ActivationMetric moves to queued", () => {
  const item = newActivationMetric("code-693", "name-91");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("ActivationMetric rejects moves from failed", () => {
  const item = newActivationMetric("code-693", "name-91");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
