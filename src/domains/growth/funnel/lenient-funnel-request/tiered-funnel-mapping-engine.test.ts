import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultTieredFunnelMappingEngine } from "./tiered-funnel-mapping-engine.js";
import { newTieredFunnelMapping } from "./tiered-funnel-mapping.js";

test("TieredFunnelMappingEngine keeps results within bounds", () => {
  const engine = defaultTieredFunnelMappingEngine();
  const item = newTieredFunnelMapping("code-397", "name-951");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
