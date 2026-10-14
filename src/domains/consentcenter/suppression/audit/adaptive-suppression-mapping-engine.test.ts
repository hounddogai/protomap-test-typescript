import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultAdaptiveSuppressionMappingEngine } from "./adaptive-suppression-mapping-engine.js";
import { newAdaptiveSuppressionMapping } from "./adaptive-suppression-mapping.js";

test("AdaptiveSuppressionMappingEngine keeps results within bounds", () => {
  const engine = defaultAdaptiveSuppressionMappingEngine(flags.newRegistry());
  const item = newAdaptiveSuppressionMapping("code-447", "name-341");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
