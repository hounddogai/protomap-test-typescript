import assert from "node:assert/strict";
import { test } from "node:test";
import { newReputationProfile } from "./reputation-profile.js";

test("ReputationProfile starts in new", () => {
  const item = newReputationProfile("code-297", "label-507");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ReputationProfile moves to failed", () => {
  const item = newReputationProfile("code-297", "label-507");
  try {
    item.moveTo("failed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "failed", "status");
});

test("ReputationProfile rejects moves from failed", () => {
  const item = newReputationProfile("code-297", "label-507");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
