import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultLegacyOptOutSegmentEngine } from "./legacy-opt-out-segment-engine.js";
import { newLegacyOptOutSegment } from "./legacy-opt-out-segment.js";

test("LegacyOptOutSegmentEngine keeps results within bounds", () => {
  const engine = defaultLegacyOptOutSegmentEngine();
  const item = newLegacyOptOutSegment("code-819", "label-345");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
