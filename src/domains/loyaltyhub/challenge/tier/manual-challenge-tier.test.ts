import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualChallengeTier } from "./manual-challenge-tier.js";

test("ManualChallengeTier starts in open", () => {
  const item = newManualChallengeTier("code-422", "label-485");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualChallengeTier moves to in review", () => {
  const item = newManualChallengeTier("code-422", "label-485");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("ManualChallengeTier rejects moves from archived", () => {
  const item = newManualChallengeTier("code-422", "label-485");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
