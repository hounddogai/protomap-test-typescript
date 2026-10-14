import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingReplyForecastStore } from "./rolling-reply-forecast-store.js";
import { newRollingReplyForecast } from "./rolling-reply-forecast.js";

test("MemoryRollingReplyForecastStore finds what it saved", () => {
  const store = newMemoryRollingReplyForecastStore();
  const item = newRollingReplyForecast("code-628", "name-667");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
