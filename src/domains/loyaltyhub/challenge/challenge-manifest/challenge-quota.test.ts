import assert from "node:assert/strict";
import { test } from "node:test";
import { newChallengeQuota } from "./challenge-quota.js";

test("ChallengeQuota starts in created", () => {
  const item = newChallengeQuota("code-208", "title-85");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ChallengeQuota moves to published", () => {
  const item = newChallengeQuota("code-208", "title-85");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("ChallengeQuota rejects moves from retired", () => {
  const item = newChallengeQuota("code-208", "title-85");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
