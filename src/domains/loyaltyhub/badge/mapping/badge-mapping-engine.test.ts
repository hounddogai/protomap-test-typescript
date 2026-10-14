import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultBadgeMappingEngine } from "./badge-mapping-engine.js";
import { newBadgeMapping } from "./badge-mapping.js";

test("BadgeMappingEngine keeps results within bounds", () => {
  const engine = defaultBadgeMappingEngine();
  const item = newBadgeMapping("code-702", "label-79");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
