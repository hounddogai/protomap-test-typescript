import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryScheduledBidRuleForecastStore } from "./scheduled-bid-rule-forecast-store.js";
import { newScheduledBidRuleForecast } from "./scheduled-bid-rule-forecast.js";

test("MemoryScheduledBidRuleForecastStore finds what it saved", () => {
  const store = newMemoryScheduledBidRuleForecastStore();
  const item = newScheduledBidRuleForecast("code-901", "title-798");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
