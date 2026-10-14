import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientBranchMetric } from "./lenient-branch-metric.js";

test("LenientBranchMetric starts in draft", () => {
  const item = newLenientBranchMetric("code-243", "title-721");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientBranchMetric moves to pending", () => {
  const item = newLenientBranchMetric("code-243", "title-721");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("LenientBranchMetric rejects moves from closed", () => {
  const item = newLenientBranchMetric("code-243", "title-721");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
