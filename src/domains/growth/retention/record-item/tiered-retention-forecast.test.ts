import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredRetentionForecast } from "./tiered-retention-forecast.js";

test("TieredRetentionForecast starts in created", () => {
  const item = newTieredRetentionForecast("code-545", "title-285");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredRetentionForecast moves to validated", () => {
  const item = newTieredRetentionForecast("code-545", "title-285");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("TieredRetentionForecast rejects moves from retired", () => {
  const item = newTieredRetentionForecast("code-545", "title-285");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
