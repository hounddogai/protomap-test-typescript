import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryRewardRuleForecast } from "./primary-reward-rule-forecast.js";

test("PrimaryRewardRuleForecast starts in requested", () => {
  const item = newPrimaryRewardRuleForecast("code-844", "label-501");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryRewardRuleForecast moves to granted", () => {
  const item = newPrimaryRewardRuleForecast("code-844", "label-501");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("PrimaryRewardRuleForecast rejects moves from expired", () => {
  const item = newPrimaryRewardRuleForecast("code-844", "label-501");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
