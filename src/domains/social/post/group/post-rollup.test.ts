import assert from "node:assert/strict";
import { test } from "node:test";
import { newPostRollup } from "./post-rollup.js";

test("PostRollup starts in new", () => {
  const item = newPostRollup("code-120", "name-676");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PostRollup moves to running", () => {
  const item = newPostRollup("code-120", "name-676");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("PostRollup rejects moves from failed", () => {
  const item = newPostRollup("code-120", "name-676");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
