import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultLegacyJourneyMappingEngine } from "./legacy-journey-mapping-engine.js";
import { newLegacyJourneyMapping } from "./legacy-journey-mapping.js";

test("LegacyJourneyMappingEngine keeps results within bounds", () => {
  const engine = defaultLegacyJourneyMappingEngine();
  const item = newLegacyJourneyMapping("code-786", "label-534");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
