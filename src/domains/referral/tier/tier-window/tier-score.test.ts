import assert from "node:assert/strict";
import { test } from "node:test";
import { newTierScore } from "./tier-score.js";

test("TierScore starts in created", () => {
  const item = newTierScore("code-609", "name-902");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TierScore moves to validated", () => {
  const item = newTierScore("code-609", "name-902");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("TierScore rejects moves from retired", () => {
  const item = newTierScore("code-609", "name-902");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
