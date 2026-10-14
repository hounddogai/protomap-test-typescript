import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedPathPreference } from "./batched-path-preference.js";

test("BatchedPathPreference starts in created", () => {
  const item = newBatchedPathPreference("code-96", "title-70");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedPathPreference moves to published", () => {
  const item = newBatchedPathPreference("code-96", "title-70");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("BatchedPathPreference rejects moves from retired", () => {
  const item = newBatchedPathPreference("code-96", "title-70");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
