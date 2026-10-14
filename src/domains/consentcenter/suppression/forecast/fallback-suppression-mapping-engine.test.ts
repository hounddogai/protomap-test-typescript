import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultFallbackSuppressionMappingEngine } from "./fallback-suppression-mapping-engine.js";
import { newFallbackSuppressionMapping } from "./fallback-suppression-mapping.js";

test("FallbackSuppressionMappingEngine keeps results within bounds", () => {
  const engine = defaultFallbackSuppressionMappingEngine();
  const item = newFallbackSuppressionMapping("code-49", "label-445");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
