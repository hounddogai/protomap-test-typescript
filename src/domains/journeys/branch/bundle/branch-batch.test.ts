import assert from "node:assert/strict";
import { test } from "node:test";
import { newBranchBatch } from "./branch-batch.js";

test("BranchBatch starts in draft", () => {
  const item = newBranchBatch("code-444", "name-910");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BranchBatch moves to suspended", () => {
  const item = newBranchBatch("code-444", "name-910");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("BranchBatch rejects moves from closed", () => {
  const item = newBranchBatch("code-444", "name-910");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
