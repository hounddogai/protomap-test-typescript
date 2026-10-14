import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryMentionForecastStore } from "./mention-forecast-store.js";
import { newMentionForecast } from "./mention-forecast.js";

test("MemoryMentionForecastStore finds what it saved", () => {
  const store = newMemoryMentionForecastStore();
  const item = newMentionForecast("code-960", "name-759");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
