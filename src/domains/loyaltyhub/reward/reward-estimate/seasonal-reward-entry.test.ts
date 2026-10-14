import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalRewardEntry } from "./seasonal-reward-entry.js";

test("SeasonalRewardEntry starts in requested", () => {
  const item = newSeasonalRewardEntry("code-831", "title-451");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalRewardEntry moves to granted", () => {
  const item = newSeasonalRewardEntry("code-831", "title-451");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("SeasonalRewardEntry rejects moves from expired", () => {
  const item = newSeasonalRewardEntry("code-831", "title-451");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
