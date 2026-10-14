import assert from "node:assert/strict";
import { test } from "node:test";
import { newPostCheckpoint } from "./post-checkpoint.js";

test("PostCheckpoint starts in requested", () => {
  const item = newPostCheckpoint("code-265", "label-371");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PostCheckpoint moves to granted", () => {
  const item = newPostCheckpoint("code-265", "label-371");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("PostCheckpoint rejects moves from expired", () => {
  const item = newPostCheckpoint("code-265", "label-371");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
