import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacySubscriptionBundle } from "./legacy-subscription-bundle.js";

test("LegacySubscriptionBundle starts in draft", () => {
  const item = newLegacySubscriptionBundle("code-456", "title-496");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacySubscriptionBundle moves to pending", () => {
  const item = newLegacySubscriptionBundle("code-456", "title-496");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("LegacySubscriptionBundle rejects moves from closed", () => {
  const item = newLegacySubscriptionBundle("code-456", "title-496");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
