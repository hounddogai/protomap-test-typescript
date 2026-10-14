import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredApprovalForecastStore } from "./tiered-approval-forecast-store.js";
import { newTieredApprovalForecast } from "./tiered-approval-forecast.js";

test("MemoryTieredApprovalForecastStore finds what it saved", () => {
  const store = newMemoryTieredApprovalForecastStore();
  const item = newTieredApprovalForecast("code-906", "label-430");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
