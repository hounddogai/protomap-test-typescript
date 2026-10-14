import assert from "node:assert/strict";
import { test } from "node:test";
import { newEscalationMetric } from "./escalation-metric.js";

test("EscalationMetric starts in draft", () => {
  const item = newEscalationMetric("code-769", "label-324");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("EscalationMetric moves to pending", () => {
  const item = newEscalationMetric("code-769", "label-324");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("EscalationMetric rejects moves from closed", () => {
  const item = newEscalationMetric("code-769", "label-324");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
