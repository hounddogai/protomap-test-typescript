import assert from "node:assert/strict";
import { test } from "node:test";
import { newTierProfile } from "./tier-profile.js";

test("TierProfile starts in planned", () => {
  const item = newTierProfile("code-795", "name-582");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TierProfile moves to cancelled", () => {
  const item = newTierProfile("code-795", "name-582");
  try {
    item.moveTo("cancelled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "cancelled", "status");
});

test("TierProfile rejects moves from cancelled", () => {
  const item = newTierProfile("code-795", "name-582");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
