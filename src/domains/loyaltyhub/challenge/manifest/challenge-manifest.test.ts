import assert from "node:assert/strict";
import { test } from "node:test";
import { newChallengeManifest } from "./challenge-manifest.js";

test("ChallengeManifest starts in new", () => {
  const item = newChallengeManifest("code-426", "title-345");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ChallengeManifest moves to queued", () => {
  const item = newChallengeManifest("code-426", "title-345");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("ChallengeManifest rejects moves from failed", () => {
  const item = newChallengeManifest("code-426", "title-345");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
