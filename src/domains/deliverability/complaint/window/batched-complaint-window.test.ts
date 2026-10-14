import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedComplaintWindow } from "./batched-complaint-window.js";

test("BatchedComplaintWindow starts in draft", () => {
  const item = newBatchedComplaintWindow("code-518", "title-376");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedComplaintWindow moves to active", () => {
  const item = newBatchedComplaintWindow("code-518", "title-376");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("BatchedComplaintWindow rejects moves from closed", () => {
  const item = newBatchedComplaintWindow("code-518", "title-376");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
