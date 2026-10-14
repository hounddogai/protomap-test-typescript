import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultBatchedTouchpointPreferenceEngine } from "./batched-touchpoint-preference-engine.js";
import { newBatchedTouchpointPreference } from "./batched-touchpoint-preference.js";

test("BatchedTouchpointPreferenceEngine keeps results within bounds", () => {
  const engine = defaultBatchedTouchpointPreferenceEngine();
  const item = newBatchedTouchpointPreference("code-578", "label-452");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
