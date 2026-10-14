import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalChallengeException } from "./seasonal-challenge-exception.js";

test("SeasonalChallengeException starts in created", () => {
  const item = newSeasonalChallengeException("code-671", "name-280");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalChallengeException moves to retired", () => {
  const item = newSeasonalChallengeException("code-671", "name-280");
  try {
    item.moveTo("retired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "retired", "status");
});

test("SeasonalChallengeException rejects moves from retired", () => {
  const item = newSeasonalChallengeException("code-671", "name-280");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
