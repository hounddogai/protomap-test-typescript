import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultLenientTierMappingEngine } from "./lenient-tier-mapping-engine.js";
import { newLenientTierMapping } from "./lenient-tier-mapping.js";

test("LenientTierMappingEngine keeps results within bounds", () => {
  const engine = defaultLenientTierMappingEngine();
  const item = newLenientTierMapping("code-134", "title-341");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
