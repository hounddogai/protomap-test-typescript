import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalPaywallQuota } from "./seasonal-paywall-quota.js";

test("SeasonalPaywallQuota starts in requested", () => {
  const item = newSeasonalPaywallQuota("code-607", "label-409");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalPaywallQuota moves to granted", () => {
  const item = newSeasonalPaywallQuota("code-607", "label-409");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("SeasonalPaywallQuota rejects moves from expired", () => {
  const item = newSeasonalPaywallQuota("code-607", "label-409");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
