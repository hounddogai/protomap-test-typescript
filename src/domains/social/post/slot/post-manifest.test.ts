import assert from "node:assert/strict";
import { test } from "node:test";
import { newPostManifest } from "./post-manifest.js";

test("PostManifest starts in new", () => {
  const item = newPostManifest("code-465", "title-923");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PostManifest moves to done", () => {
  const item = newPostManifest("code-465", "title-923");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("PostManifest rejects moves from failed", () => {
  const item = newPostManifest("code-465", "title-923");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
