import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultSenderThresholdEngine } from "./sender-threshold-engine.js";
import { newSenderThreshold } from "./sender-threshold.js";

test("SenderThresholdEngine keeps results within bounds", () => {
  const engine = defaultSenderThresholdEngine();
  const item = newSenderThreshold("code-612", "title-99");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
