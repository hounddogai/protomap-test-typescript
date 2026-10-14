import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultTieredCsatMappingEngine } from "./tiered-csat-mapping-engine.js";
import { newTieredCsatMapping } from "./tiered-csat-mapping.js";

test("TieredCsatMappingEngine keeps results within bounds", () => {
  const engine = defaultTieredCsatMappingEngine();
  const item = newTieredCsatMapping("code-962", "title-975");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
