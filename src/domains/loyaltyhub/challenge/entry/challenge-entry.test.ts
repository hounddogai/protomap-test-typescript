import assert from "node:assert/strict";
import { test } from "node:test";
import { newChallengeEntry } from "./challenge-entry.js";

test("ChallengeEntry starts in draft", () => {
  const item = newChallengeEntry("code-300", "title-851");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ChallengeEntry moves to pending", () => {
  const item = newChallengeEntry("code-300", "title-851");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("ChallengeEntry rejects moves from closed", () => {
  const item = newChallengeEntry("code-300", "title-851");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
