import assert from "node:assert/strict";
import { test } from "node:test";
import { newChallengeDigest } from "./challenge-digest.js";

test("ChallengeDigest starts in open", () => {
  const item = newChallengeDigest("code-503", "label-492");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ChallengeDigest moves to reopened", () => {
  const item = newChallengeDigest("code-503", "label-492");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("ChallengeDigest rejects moves from archived", () => {
  const item = newChallengeDigest("code-503", "label-492");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
