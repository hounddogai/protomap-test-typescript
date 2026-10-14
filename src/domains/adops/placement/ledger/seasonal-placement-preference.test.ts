import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalPlacementPreference } from "./seasonal-placement-preference.js";

test("SeasonalPlacementPreference starts in planned", () => {
  const item = newSeasonalPlacementPreference("code-758", "title-69");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalPlacementPreference moves to scheduled", () => {
  const item = newSeasonalPlacementPreference("code-758", "title-69");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("SeasonalPlacementPreference rejects moves from cancelled", () => {
  const item = newSeasonalPlacementPreference("code-758", "title-69");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
