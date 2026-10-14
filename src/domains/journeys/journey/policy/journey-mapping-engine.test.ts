import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultJourneyMappingEngine } from "./journey-mapping-engine.js";
import { newJourneyMapping } from "./journey-mapping.js";

test("JourneyMappingEngine keeps results within bounds", () => {
  const engine = defaultJourneyMappingEngine();
  const item = newJourneyMapping("code-399", "title-640");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
