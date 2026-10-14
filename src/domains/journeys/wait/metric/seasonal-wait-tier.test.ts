import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalWaitTier } from "./seasonal-wait-tier.js";

test("SeasonalWaitTier starts in draft", () => {
  const item = newSeasonalWaitTier("code-562", "name-480");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalWaitTier moves to active", () => {
  const item = newSeasonalWaitTier("code-562", "name-480");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("SeasonalWaitTier rejects moves from closed", () => {
  const item = newSeasonalWaitTier("code-562", "name-480");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
