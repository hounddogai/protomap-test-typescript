import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedPreferenceRequest } from "./batched-preference-request.js";

test("BatchedPreferenceRequest starts in open", () => {
  const item = newBatchedPreferenceRequest("code-710", "name-740");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedPreferenceRequest moves to in review", () => {
  const item = newBatchedPreferenceRequest("code-710", "name-740");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("BatchedPreferenceRequest rejects moves from archived", () => {
  const item = newBatchedPreferenceRequest("code-710", "name-740");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
