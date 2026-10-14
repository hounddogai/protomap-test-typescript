import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalSubscriptionAllocation } from "./regional-subscription-allocation.js";

test("RegionalSubscriptionAllocation starts in proposed", () => {
  const item = newRegionalSubscriptionAllocation("code-533", "label-821");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalSubscriptionAllocation moves to withdrawn", () => {
  const item = newRegionalSubscriptionAllocation("code-533", "label-821");
  try {
    item.moveTo("withdrawn");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "withdrawn", "status");
});

test("RegionalSubscriptionAllocation rejects moves from withdrawn", () => {
  const item = newRegionalSubscriptionAllocation("code-533", "label-821");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
