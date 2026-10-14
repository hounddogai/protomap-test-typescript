import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyRedemptionBundle } from "./legacy-redemption-bundle.js";

test("LegacyRedemptionBundle starts in created", () => {
  const item = newLegacyRedemptionBundle("code-400", "label-191");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyRedemptionBundle moves to published", () => {
  const item = newLegacyRedemptionBundle("code-400", "label-191");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("LegacyRedemptionBundle rejects moves from retired", () => {
  const item = newLegacyRedemptionBundle("code-400", "label-191");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
