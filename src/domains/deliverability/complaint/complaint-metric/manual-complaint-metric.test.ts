import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualComplaintMetric } from "./manual-complaint-metric.js";

test("ManualComplaintMetric starts in draft", () => {
  const item = newManualComplaintMetric("code-721", "title-515");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualComplaintMetric moves to closed", () => {
  const item = newManualComplaintMetric("code-721", "title-515");
  try {
    item.moveTo("closed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "closed", "status");
});

test("ManualComplaintMetric rejects moves from closed", () => {
  const item = newManualComplaintMetric("code-721", "title-515");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
