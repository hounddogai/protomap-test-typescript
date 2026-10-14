import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPlacementSegmentEngine } from "./placement-segment-engine.js";
import { newPlacementSegment } from "./placement-segment.js";

test("PlacementSegmentEngine keeps results within bounds", () => {
  const engine = defaultPlacementSegmentEngine();
  const item = newPlacementSegment("code-570", "title-712");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
