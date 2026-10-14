import assert from "node:assert/strict";
import { test } from "node:test";
import { newApprovalMetric } from "./approval-metric.js";

test("ApprovalMetric starts in open", () => {
  const item = newApprovalMetric("code-992", "label-844");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ApprovalMetric moves to in review", () => {
  const item = newApprovalMetric("code-992", "label-844");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("ApprovalMetric rejects moves from archived", () => {
  const item = newApprovalMetric("code-992", "label-844");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
