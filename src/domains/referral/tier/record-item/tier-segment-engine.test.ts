import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultTierSegmentEngine } from "./tier-segment-engine.js";
import { newTierSegment } from "./tier-segment.js";

test("TierSegmentEngine keeps results within bounds", () => {
  const engine = defaultTierSegmentEngine();
  const item = newTierSegment("code-713", "title-932");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
