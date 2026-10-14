import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryChallengeForecastStore } from "./challenge-forecast-store.js";
import { newChallengeForecast } from "./challenge-forecast.js";

test("MemoryChallengeForecastStore finds what it saved", () => {
  const store = newMemoryChallengeForecastStore();
  const item = newChallengeForecast("code-161", "name-918");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
