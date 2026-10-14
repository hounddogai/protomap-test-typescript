import assert from "node:assert/strict";
import { test } from "node:test";
import { newRewardRuleForecast } from "./reward-rule-forecast.js";

test("RewardRuleForecast starts in requested", () => {
  const item = newRewardRuleForecast("code-861", "label-453");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RewardRuleForecast moves to revoked", () => {
  const item = newRewardRuleForecast("code-861", "label-453");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("RewardRuleForecast rejects moves from expired", () => {
  const item = newRewardRuleForecast("code-861", "label-453");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
