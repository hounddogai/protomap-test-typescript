import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacySubscriptionMilestone } from "./legacy-subscription-milestone.js";

test("LegacySubscriptionMilestone starts in requested", () => {
  const item = newLegacySubscriptionMilestone("code-335", "title-843");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacySubscriptionMilestone moves to granted", () => {
  const item = newLegacySubscriptionMilestone("code-335", "title-843");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("LegacySubscriptionMilestone rejects moves from expired", () => {
  const item = newLegacySubscriptionMilestone("code-335", "title-843");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
