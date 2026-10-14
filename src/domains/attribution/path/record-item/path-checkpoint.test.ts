import assert from "node:assert/strict";
import { test } from "node:test";
import { newPathCheckpoint } from "./path-checkpoint.js";

test("PathCheckpoint starts in new", () => {
  const item = newPathCheckpoint("code-907", "name-31");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PathCheckpoint moves to done", () => {
  const item = newPathCheckpoint("code-907", "name-31");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("PathCheckpoint rejects moves from failed", () => {
  const item = newPathCheckpoint("code-907", "name-31");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
