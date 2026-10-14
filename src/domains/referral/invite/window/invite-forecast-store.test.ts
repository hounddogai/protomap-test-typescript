import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryInviteForecastStore } from "./invite-forecast-store.js";
import { newInviteForecast } from "./invite-forecast.js";

test("MemoryInviteForecastStore finds what it saved", () => {
  const store = newMemoryInviteForecastStore();
  const item = newInviteForecast("code-64", "title-428");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
