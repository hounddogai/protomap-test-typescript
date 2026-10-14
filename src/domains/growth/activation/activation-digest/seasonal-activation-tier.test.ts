import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalActivationTier } from "./seasonal-activation-tier.js";

test("SeasonalActivationTier starts in created", () => {
  const item = newSeasonalActivationTier("code-152", "name-151");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalActivationTier moves to validated", () => {
  const item = newSeasonalActivationTier("code-152", "name-151");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("SeasonalActivationTier rejects moves from retired", () => {
  const item = newSeasonalActivationTier("code-152", "name-151");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
