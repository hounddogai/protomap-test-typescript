import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalPaywallDigest } from "./seasonal-paywall-digest.js";

test("SeasonalPaywallDigest starts in open", () => {
  const item = newSeasonalPaywallDigest("code-134", "name-898");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalPaywallDigest moves to archived", () => {
  const item = newSeasonalPaywallDigest("code-134", "name-898");
  try {
    item.moveTo("archived");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "archived", "status");
});

test("SeasonalPaywallDigest rejects moves from archived", () => {
  const item = newSeasonalPaywallDigest("code-134", "name-898");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
