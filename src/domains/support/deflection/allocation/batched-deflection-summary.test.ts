import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedDeflectionSummary } from "./batched-deflection-summary.js";

test("BatchedDeflectionSummary starts in draft", () => {
  const item = newBatchedDeflectionSummary("code-982", "title-698");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedDeflectionSummary moves to active", () => {
  const item = newBatchedDeflectionSummary("code-982", "title-698");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("BatchedDeflectionSummary rejects moves from closed", () => {
  const item = newBatchedDeflectionSummary("code-982", "title-698");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
