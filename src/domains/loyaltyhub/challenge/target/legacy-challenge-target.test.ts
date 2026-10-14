import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyChallengeTarget } from "./legacy-challenge-target.js";

test("LegacyChallengeTarget starts in proposed", () => {
  const item = newLegacyChallengeTarget("code-96", "title-508");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyChallengeTarget moves to approved", () => {
  const item = newLegacyChallengeTarget("code-96", "title-508");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("LegacyChallengeTarget rejects moves from withdrawn", () => {
  const item = newLegacyChallengeTarget("code-96", "title-508");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
