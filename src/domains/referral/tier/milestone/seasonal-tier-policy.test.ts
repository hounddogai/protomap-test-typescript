import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalTierPolicy } from "./seasonal-tier-policy.js";

test("SeasonalTierPolicy starts in idle", () => {
  const item = newSeasonalTierPolicy("code-962", "title-682");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalTierPolicy moves to ready", () => {
  const item = newSeasonalTierPolicy("code-962", "title-682");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("SeasonalTierPolicy rejects moves from stopped", () => {
  const item = newSeasonalTierPolicy("code-962", "title-682");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
