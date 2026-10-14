import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultRegionalQueuePreferenceEngine } from "./regional-queue-preference-engine.js";
import { newRegionalQueuePreference } from "./regional-queue-preference.js";

test("RegionalQueuePreferenceEngine keeps results within bounds", () => {
  const engine = defaultRegionalQueuePreferenceEngine();
  const item = newRegionalQueuePreference("code-844", "name-614");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
