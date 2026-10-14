import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledReputationProfile } from "./scheduled-reputation-profile.js";

test("ScheduledReputationProfile starts in open", () => {
  const item = newScheduledReputationProfile("code-667", "name-320");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledReputationProfile moves to in review", () => {
  const item = newScheduledReputationProfile("code-667", "name-320");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("ScheduledReputationProfile rejects moves from archived", () => {
  const item = newScheduledReputationProfile("code-667", "name-320");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
