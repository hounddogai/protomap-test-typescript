import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalPaywallPolicy } from "./seasonal-paywall-policy.js";

test("SeasonalPaywallPolicy starts in draft", () => {
  const item = newSeasonalPaywallPolicy("code-162", "label-542");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalPaywallPolicy moves to closed", () => {
  const item = newSeasonalPaywallPolicy("code-162", "label-542");
  try {
    item.moveTo("closed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "closed", "status");
});

test("SeasonalPaywallPolicy rejects moves from closed", () => {
  const item = newSeasonalPaywallPolicy("code-162", "label-542");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
