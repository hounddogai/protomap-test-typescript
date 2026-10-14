import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultTieredActivationSegmentEngine } from "./tiered-activation-segment-engine.js";
import { newTieredActivationSegment } from "./tiered-activation-segment.js";

test("TieredActivationSegmentEngine keeps results within bounds", () => {
  const engine = defaultTieredActivationSegmentEngine();
  const item = newTieredActivationSegment("code-337", "label-967");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
