import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRewardRuleForecastStore } from "./reward-rule-forecast-store.js";
import { newRewardRuleForecast } from "./reward-rule-forecast.js";

test("MemoryRewardRuleForecastStore finds what it saved", () => {
  const store = newMemoryRewardRuleForecastStore();
  const item = newRewardRuleForecast("code-861", "label-453");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
