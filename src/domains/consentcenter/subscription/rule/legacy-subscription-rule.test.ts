import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacySubscriptionRule } from "./legacy-subscription-rule.js";

test("LegacySubscriptionRule starts in proposed", () => {
  const item = newLegacySubscriptionRule("code-791", "title-147");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacySubscriptionRule moves to rejected", () => {
  const item = newLegacySubscriptionRule("code-791", "title-147");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("LegacySubscriptionRule rejects moves from withdrawn", () => {
  const item = newLegacySubscriptionRule("code-791", "title-147");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
