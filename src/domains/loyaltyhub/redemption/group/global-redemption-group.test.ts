import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalRedemptionGroup } from "./global-redemption-group.js";

test("GlobalRedemptionGroup starts in proposed", () => {
  const item = newGlobalRedemptionGroup("code-945", "name-418");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalRedemptionGroup moves to approved", () => {
  const item = newGlobalRedemptionGroup("code-945", "name-418");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("GlobalRedemptionGroup rejects moves from withdrawn", () => {
  const item = newGlobalRedemptionGroup("code-945", "name-418");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
