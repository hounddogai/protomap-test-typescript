import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultQueuePreferenceEngine } from "./queue-preference-engine.js";
import { newQueuePreference } from "./queue-preference.js";

test("QueuePreferenceEngine keeps results within bounds", () => {
  const engine = defaultQueuePreferenceEngine();
  const item = newQueuePreference("code-854", "label-600");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
