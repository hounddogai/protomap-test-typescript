import assert from "node:assert/strict";
import { test } from "node:test";
import { newChallengeSnapshot } from "./challenge-snapshot.js";

test("ChallengeSnapshot starts in planned", () => {
  const item = newChallengeSnapshot("code-493", "title-413");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ChallengeSnapshot moves to in progress", () => {
  const item = newChallengeSnapshot("code-493", "title-413");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("ChallengeSnapshot rejects moves from cancelled", () => {
  const item = newChallengeSnapshot("code-493", "title-413");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
