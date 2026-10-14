import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultTieredDeflectionSegmentEngine } from "./tiered-deflection-segment-engine.js";
import { newTieredDeflectionSegment } from "./tiered-deflection-segment.js";

test("TieredDeflectionSegmentEngine keeps results within bounds", () => {
  const engine = defaultTieredDeflectionSegmentEngine();
  const item = newTieredDeflectionSegment("code-665", "name-94");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
