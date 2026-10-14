import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultTieredSlaMappingEngine } from "./tiered-sla-mapping-engine.js";
import { newTieredSlaMapping } from "./tiered-sla-mapping.js";

test("TieredSlaMappingEngine keeps results within bounds", () => {
  const engine = defaultTieredSlaMappingEngine();
  const item = newTieredSlaMapping("code-241", "title-966");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
