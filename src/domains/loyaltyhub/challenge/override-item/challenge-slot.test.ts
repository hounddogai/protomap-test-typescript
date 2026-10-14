import assert from "node:assert/strict";
import { test } from "node:test";
import { newChallengeSlot } from "./challenge-slot.js";

test("ChallengeSlot starts in created", () => {
  const item = newChallengeSlot("code-296", "name-137");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ChallengeSlot moves to validated", () => {
  const item = newChallengeSlot("code-296", "name-137");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("ChallengeSlot rejects moves from retired", () => {
  const item = newChallengeSlot("code-296", "name-137");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
