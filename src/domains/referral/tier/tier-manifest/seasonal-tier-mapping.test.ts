import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalTierMapping } from "./seasonal-tier-mapping.js";

test("SeasonalTierMapping starts in open", () => {
  const item = newSeasonalTierMapping("code-640", "title-357");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalTierMapping moves to resolved", () => {
  const item = newSeasonalTierMapping("code-640", "title-357");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("SeasonalTierMapping rejects moves from archived", () => {
  const item = newSeasonalTierMapping("code-640", "title-357");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
