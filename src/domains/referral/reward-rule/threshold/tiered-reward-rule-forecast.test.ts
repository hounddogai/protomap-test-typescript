import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredRewardRuleForecast } from "./tiered-reward-rule-forecast.js";

test("TieredRewardRuleForecast starts in created", () => {
  const item = newTieredRewardRuleForecast("code-772", "title-560");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredRewardRuleForecast moves to validated", () => {
  const item = newTieredRewardRuleForecast("code-772", "title-560");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("TieredRewardRuleForecast rejects moves from retired", () => {
  const item = newTieredRewardRuleForecast("code-772", "title-560");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
