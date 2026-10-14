import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredChallengeOverride } from "./tiered-challenge-override.js";

test("TieredChallengeOverride starts in open", () => {
  const item = newTieredChallengeOverride("code-249", "title-152");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredChallengeOverride moves to reopened", () => {
  const item = newTieredChallengeOverride("code-249", "title-152");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("TieredChallengeOverride rejects moves from archived", () => {
  const item = newTieredChallengeOverride("code-249", "title-152");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
