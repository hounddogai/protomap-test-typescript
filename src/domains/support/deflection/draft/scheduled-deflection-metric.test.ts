import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledDeflectionMetric } from "./scheduled-deflection-metric.js";

test("ScheduledDeflectionMetric starts in created", () => {
  const item = newScheduledDeflectionMetric("code-601", "label-863");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledDeflectionMetric moves to validated", () => {
  const item = newScheduledDeflectionMetric("code-601", "label-863");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("ScheduledDeflectionMetric rejects moves from retired", () => {
  const item = newScheduledDeflectionMetric("code-601", "label-863");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
