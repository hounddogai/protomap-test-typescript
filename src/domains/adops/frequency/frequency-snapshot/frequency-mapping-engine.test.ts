import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultFrequencyMappingEngine } from "./frequency-mapping-engine.js";
import { newFrequencyMapping } from "./frequency-mapping.js";

test("FrequencyMappingEngine keeps results within bounds", () => {
  const engine = defaultFrequencyMappingEngine();
  const item = newFrequencyMapping("code-192", "name-798");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
