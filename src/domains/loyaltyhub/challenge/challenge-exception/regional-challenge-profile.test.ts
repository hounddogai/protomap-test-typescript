import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalChallengeProfile } from "./regional-challenge-profile.js";

test("RegionalChallengeProfile starts in new", () => {
  const item = newRegionalChallengeProfile("code-538", "label-726");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalChallengeProfile moves to queued", () => {
  const item = newRegionalChallengeProfile("code-538", "label-726");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("RegionalChallengeProfile rejects moves from failed", () => {
  const item = newRegionalChallengeProfile("code-538", "label-726");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
