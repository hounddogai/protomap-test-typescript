import assert from "node:assert/strict";
import { test } from "node:test";
import { newChallengeAllocation } from "./challenge-allocation.js";

test("ChallengeAllocation starts in draft", () => {
  const item = newChallengeAllocation("code-294", "title-766");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ChallengeAllocation moves to pending", () => {
  const item = newChallengeAllocation("code-294", "title-766");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("ChallengeAllocation rejects moves from closed", () => {
  const item = newChallengeAllocation("code-294", "title-766");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
