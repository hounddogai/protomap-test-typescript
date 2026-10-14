import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryChallengeManifest } from "./primary-challenge-manifest.js";

test("PrimaryChallengeManifest starts in planned", () => {
  const item = newPrimaryChallengeManifest("code-632", "name-856");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryChallengeManifest moves to scheduled", () => {
  const item = newPrimaryChallengeManifest("code-632", "name-856");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("PrimaryChallengeManifest rejects moves from cancelled", () => {
  const item = newPrimaryChallengeManifest("code-632", "name-856");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
