import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingReputationProfile } from "./pending-reputation-profile.js";

test("PendingReputationProfile starts in planned", () => {
  const item = newPendingReputationProfile("code-797", "title-713");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingReputationProfile moves to scheduled", () => {
  const item = newPendingReputationProfile("code-797", "title-713");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("PendingReputationProfile rejects moves from cancelled", () => {
  const item = newPendingReputationProfile("code-797", "title-713");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
