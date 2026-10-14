import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultTierMappingEngine } from "./tier-mapping-engine.js";
import { newTierMapping } from "./tier-mapping.js";

test("TierMappingEngine keeps results within bounds", () => {
  const engine = defaultTierMappingEngine();
  const item = newTierMapping("code-920", "title-841");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
