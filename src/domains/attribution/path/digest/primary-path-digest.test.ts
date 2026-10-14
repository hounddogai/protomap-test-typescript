import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryPathDigest } from "./primary-path-digest.js";

test("PrimaryPathDigest starts in idle", () => {
  const item = newPrimaryPathDigest("code-518", "label-125");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryPathDigest moves to stopped", () => {
  const item = newPrimaryPathDigest("code-518", "label-125");
  try {
    item.moveTo("stopped");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "stopped", "status");
});

test("PrimaryPathDigest rejects moves from stopped", () => {
  const item = newPrimaryPathDigest("code-518", "label-125");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
