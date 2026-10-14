import assert from "node:assert/strict";
import { test } from "node:test";
import { newPostBatch } from "./post-batch.js";

test("PostBatch starts in proposed", () => {
  const item = newPostBatch("code-18", "name-8");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PostBatch moves to approved", () => {
  const item = newPostBatch("code-18", "name-8");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("PostBatch rejects moves from withdrawn", () => {
  const item = newPostBatch("code-18", "name-8");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
