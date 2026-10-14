import assert from "node:assert/strict";
import { test } from "node:test";
import { newBranchMetric } from "./branch-metric.js";

test("BranchMetric starts in open", () => {
  const item = newBranchMetric("code-682", "name-455");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BranchMetric moves to archived", () => {
  const item = newBranchMetric("code-682", "name-455");
  try {
    item.moveTo("archived");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "archived", "status");
});

test("BranchMetric rejects moves from archived", () => {
  const item = newBranchMetric("code-682", "name-455");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
