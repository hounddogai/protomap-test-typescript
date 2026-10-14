import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientApprovalForecastStore } from "./lenient-approval-forecast-store.js";
import { newLenientApprovalForecast } from "./lenient-approval-forecast.js";

test("MemoryLenientApprovalForecastStore finds what it saved", () => {
  const store = newMemoryLenientApprovalForecastStore();
  const item = newLenientApprovalForecast("code-239", "name-510");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
