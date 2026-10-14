import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalChallengeSnapshot } from "./global-challenge-snapshot.js";

test("GlobalChallengeSnapshot starts in created", () => {
  const item = newGlobalChallengeSnapshot("code-54", "name-365");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalChallengeSnapshot moves to published", () => {
  const item = newGlobalChallengeSnapshot("code-54", "name-365");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("GlobalChallengeSnapshot rejects moves from retired", () => {
  const item = newGlobalChallengeSnapshot("code-54", "name-365");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
