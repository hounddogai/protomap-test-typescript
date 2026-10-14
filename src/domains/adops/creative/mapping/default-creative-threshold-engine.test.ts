import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultDefaultCreativeThresholdEngine } from "./default-creative-threshold-engine.js";
import { newDefaultCreativeThreshold } from "./default-creative-threshold.js";

test("DefaultCreativeThresholdEngine keeps results within bounds", () => {
  const engine = defaultDefaultCreativeThresholdEngine();
  const item = newDefaultCreativeThreshold("code-252", "label-761");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
