import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRegionalBidRuleForecastStore } from "./regional-bid-rule-forecast-store.js";
import { newRegionalBidRuleForecast } from "./regional-bid-rule-forecast.js";

test("MemoryRegionalBidRuleForecastStore finds what it saved", () => {
  const store = newMemoryRegionalBidRuleForecastStore();
  const item = newRegionalBidRuleForecast("code-640", "label-300");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
