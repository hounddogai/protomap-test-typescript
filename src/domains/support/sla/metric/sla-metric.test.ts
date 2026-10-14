import assert from "node:assert/strict";
import { test } from "node:test";
import { newSlaMetric } from "./sla-metric.js";

test("SlaMetric starts in open", () => {
  const item = newSlaMetric("code-210", "label-724");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SlaMetric moves to reopened", () => {
  const item = newSlaMetric("code-210", "label-724");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("SlaMetric rejects moves from archived", () => {
  const item = newSlaMetric("code-210", "label-724");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
