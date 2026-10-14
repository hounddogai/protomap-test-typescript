import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedPostProfile } from "./batched-post-profile.js";

test("BatchedPostProfile starts in created", () => {
  const item = newBatchedPostProfile("code-439", "title-584");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedPostProfile moves to validated", () => {
  const item = newBatchedPostProfile("code-439", "title-584");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("BatchedPostProfile rejects moves from retired", () => {
  const item = newBatchedPostProfile("code-439", "title-584");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
