import assert from "node:assert/strict";
import { test } from "node:test";
import { newStreakClaim } from "./streak-claim.js";

test("StreakClaim starts in planned", () => {
  const item = newStreakClaim("code-344", "name-981");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StreakClaim moves to scheduled", () => {
  const item = newStreakClaim("code-344", "name-981");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("StreakClaim rejects moves from cancelled", () => {
  const item = newStreakClaim("code-344", "name-981");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
