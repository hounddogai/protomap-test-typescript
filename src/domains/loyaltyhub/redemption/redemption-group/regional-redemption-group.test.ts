import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalRedemptionGroup } from "./regional-redemption-group.js";

test("RegionalRedemptionGroup starts in open", () => {
  const item = newRegionalRedemptionGroup("code-666", "name-245");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalRedemptionGroup moves to in review", () => {
  const item = newRegionalRedemptionGroup("code-666", "name-245");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("RegionalRedemptionGroup rejects moves from archived", () => {
  const item = newRegionalRedemptionGroup("code-666", "name-245");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
