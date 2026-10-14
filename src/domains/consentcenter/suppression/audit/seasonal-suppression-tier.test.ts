import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalSuppressionTier } from "./seasonal-suppression-tier.js";

test("SeasonalSuppressionTier starts in open", () => {
  const item = newSeasonalSuppressionTier("code-356", "title-903");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalSuppressionTier moves to in review", () => {
  const item = newSeasonalSuppressionTier("code-356", "title-903");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("SeasonalSuppressionTier rejects moves from archived", () => {
  const item = newSeasonalSuppressionTier("code-356", "title-903");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
