import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultGlobalInsightThresholdEngine } from "./global-insight-threshold-engine.js";
import { newGlobalInsightThreshold } from "./global-insight-threshold.js";

test("GlobalInsightThresholdEngine keeps results within bounds", () => {
  const engine = defaultGlobalInsightThresholdEngine(flags.newRegistry());
  const item = newGlobalInsightThreshold("code-79", "title-115");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
