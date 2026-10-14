import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultBatchedWaitPreferenceEngine } from "./batched-wait-preference-engine.js";
import { newBatchedWaitPreference } from "./batched-wait-preference.js";

test("BatchedWaitPreferenceEngine keeps results within bounds", () => {
  const engine = defaultBatchedWaitPreferenceEngine();
  const item = newBatchedWaitPreference("code-481", "title-657");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
