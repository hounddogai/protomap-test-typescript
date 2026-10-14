import assert from "node:assert/strict";
import { test } from "node:test";
import { newPostDigest } from "./post-digest.js";

test("PostDigest starts in created", () => {
  const item = newPostDigest("code-169", "name-230");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PostDigest moves to published", () => {
  const item = newPostDigest("code-169", "name-230");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("PostDigest rejects moves from retired", () => {
  const item = newPostDigest("code-169", "name-230");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
