import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredRewardRuleForecastStore } from "./tiered-reward-rule-forecast-store.js";
import { newTieredRewardRuleForecast } from "./tiered-reward-rule-forecast.js";

test("MemoryTieredRewardRuleForecastStore finds what it saved", () => {
  const store = newMemoryTieredRewardRuleForecastStore();
  const item = newTieredRewardRuleForecast("code-772", "title-560");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
