import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalTierBaseline } from "./seasonal-tier-baseline.js";

test("SeasonalTierBaseline starts in created", () => {
  const item = newSeasonalTierBaseline("code-366", "title-134");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalTierBaseline moves to validated", () => {
  const item = newSeasonalTierBaseline("code-366", "title-134");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("SeasonalTierBaseline rejects moves from retired", () => {
  const item = newSeasonalTierBaseline("code-366", "title-134");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
