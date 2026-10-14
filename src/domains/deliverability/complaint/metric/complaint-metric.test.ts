import assert from "node:assert/strict";
import { test } from "node:test";
import { newComplaintMetric } from "./complaint-metric.js";

test("ComplaintMetric starts in draft", () => {
  const item = newComplaintMetric("code-573", "name-746");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ComplaintMetric moves to closed", () => {
  const item = newComplaintMetric("code-573", "name-746");
  try {
    item.moveTo("closed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "closed", "status");
});

test("ComplaintMetric rejects moves from closed", () => {
  const item = newComplaintMetric("code-573", "name-746");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
