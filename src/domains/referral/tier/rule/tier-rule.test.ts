import assert from "node:assert/strict";
import { test } from "node:test";
import { newTierRule } from "./tier-rule.js";

test("TierRule starts in proposed", () => {
  const item = newTierRule("code-50", "label-535");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TierRule moves to approved", () => {
  const item = newTierRule("code-50", "label-535");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("TierRule rejects moves from withdrawn", () => {
  const item = newTierRule("code-50", "label-535");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
