import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredTierForecast } from "./tiered-tier-forecast.js";

test("TieredTierForecast starts in draft", () => {
  const item = newTieredTierForecast("code-883", "name-974");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredTierForecast moves to active", () => {
  const item = newTieredTierForecast("code-883", "name-974");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("TieredTierForecast rejects moves from closed", () => {
  const item = newTieredTierForecast("code-883", "name-974");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
