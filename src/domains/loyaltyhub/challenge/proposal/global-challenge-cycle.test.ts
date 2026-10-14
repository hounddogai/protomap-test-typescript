import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalChallengeCycle } from "./global-challenge-cycle.js";

test("GlobalChallengeCycle starts in planned", () => {
  const item = newGlobalChallengeCycle("code-89", "title-392");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalChallengeCycle moves to cancelled", () => {
  const item = newGlobalChallengeCycle("code-89", "title-392");
  try {
    item.moveTo("cancelled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "cancelled", "status");
});

test("GlobalChallengeCycle rejects moves from cancelled", () => {
  const item = newGlobalChallengeCycle("code-89", "title-392");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
