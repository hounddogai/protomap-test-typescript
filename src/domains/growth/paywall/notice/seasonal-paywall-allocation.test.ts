import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalPaywallAllocation } from "./seasonal-paywall-allocation.js";

test("SeasonalPaywallAllocation starts in new", () => {
  const item = newSeasonalPaywallAllocation("code-718", "label-276");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalPaywallAllocation moves to queued", () => {
  const item = newSeasonalPaywallAllocation("code-718", "label-276");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("SeasonalPaywallAllocation rejects moves from failed", () => {
  const item = newSeasonalPaywallAllocation("code-718", "label-276");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
