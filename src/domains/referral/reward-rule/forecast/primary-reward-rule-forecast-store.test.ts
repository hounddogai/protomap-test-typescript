import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPrimaryRewardRuleForecastStore } from "./primary-reward-rule-forecast-store.js";
import { newPrimaryRewardRuleForecast } from "./primary-reward-rule-forecast.js";

test("MemoryPrimaryRewardRuleForecastStore finds what it saved", () => {
  const store = newMemoryPrimaryRewardRuleForecastStore();
  const item = newPrimaryRewardRuleForecast("code-844", "label-501");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
