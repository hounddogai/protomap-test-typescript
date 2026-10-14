import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedDeflectionBundle } from "./batched-deflection-bundle.js";

test("BatchedDeflectionBundle starts in open", () => {
  const item = newBatchedDeflectionBundle("code-909", "label-552");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedDeflectionBundle moves to resolved", () => {
  const item = newBatchedDeflectionBundle("code-909", "label-552");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("BatchedDeflectionBundle rejects moves from archived", () => {
  const item = newBatchedDeflectionBundle("code-909", "label-552");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
