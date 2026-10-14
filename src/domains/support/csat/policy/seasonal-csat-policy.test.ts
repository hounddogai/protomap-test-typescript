import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalCsatPolicy } from "./seasonal-csat-policy.js";

test("SeasonalCsatPolicy starts in planned", () => {
  const item = newSeasonalCsatPolicy("code-40", "name-347");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalCsatPolicy moves to completed", () => {
  const item = newSeasonalCsatPolicy("code-40", "name-347");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("SeasonalCsatPolicy rejects moves from cancelled", () => {
  const item = newSeasonalCsatPolicy("code-40", "name-347");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
