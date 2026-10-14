import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledChallengeTier } from "./scheduled-challenge-tier.js";

test("ScheduledChallengeTier starts in planned", () => {
  const item = newScheduledChallengeTier("code-677", "label-602");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledChallengeTier moves to in progress", () => {
  const item = newScheduledChallengeTier("code-677", "label-602");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("ScheduledChallengeTier rejects moves from cancelled", () => {
  const item = newScheduledChallengeTier("code-677", "label-602");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
