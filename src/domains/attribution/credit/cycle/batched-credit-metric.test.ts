import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedCreditMetric } from "./batched-credit-metric.js";

test("BatchedCreditMetric starts in open", () => {
  const item = newBatchedCreditMetric("code-762", "title-903");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedCreditMetric moves to in review", () => {
  const item = newBatchedCreditMetric("code-762", "title-903");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("BatchedCreditMetric rejects moves from archived", () => {
  const item = newBatchedCreditMetric("code-762", "title-903");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
