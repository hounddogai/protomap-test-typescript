import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultFallbackPlacementGroupEngine } from "./fallback-placement-group-engine.js";
import { newFallbackPlacementGroup } from "./fallback-placement-group.js";

test("FallbackPlacementGroupEngine keeps results within bounds", () => {
  const engine = defaultFallbackPlacementGroupEngine();
  const item = newFallbackPlacementGroup("code-927", "title-26");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
