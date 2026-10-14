import assert from "node:assert/strict";
import { test } from "node:test";
import { newWindowMetric } from "./window-metric.js";

test("WindowMetric starts in planned", () => {
  const item = newWindowMetric("code-862", "name-433");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WindowMetric moves to scheduled", () => {
  const item = newWindowMetric("code-862", "name-433");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("WindowMetric rejects moves from cancelled", () => {
  const item = newWindowMetric("code-862", "name-433");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
