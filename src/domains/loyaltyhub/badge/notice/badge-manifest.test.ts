import assert from "node:assert/strict";
import { test } from "node:test";
import { newBadgeManifest } from "./badge-manifest.js";

test("BadgeManifest starts in new", () => {
  const item = newBadgeManifest("code-331", "name-630");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BadgeManifest moves to done", () => {
  const item = newBadgeManifest("code-331", "name-630");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("BadgeManifest rejects moves from failed", () => {
  const item = newBadgeManifest("code-331", "name-630");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
