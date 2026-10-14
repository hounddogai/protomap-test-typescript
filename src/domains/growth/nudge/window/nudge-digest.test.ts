import assert from "node:assert/strict";
import { test } from "node:test";
import { newNudgeDigest } from "./nudge-digest.js";

test("NudgeDigest starts in new", () => {
  const item = newNudgeDigest("code-921", "title-4");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("NudgeDigest moves to queued", () => {
  const item = newNudgeDigest("code-921", "title-4");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("NudgeDigest rejects moves from failed", () => {
  const item = newNudgeDigest("code-921", "title-4");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
