import assert from "node:assert/strict";
import { test } from "node:test";
import { newReputationDigest } from "./reputation-digest.js";

test("ReputationDigest starts in new", () => {
  const item = newReputationDigest("code-578", "label-682");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ReputationDigest moves to done", () => {
  const item = newReputationDigest("code-578", "label-682");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("ReputationDigest rejects moves from failed", () => {
  const item = newReputationDigest("code-578", "label-682");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
