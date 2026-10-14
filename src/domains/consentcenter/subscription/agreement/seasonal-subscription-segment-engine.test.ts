import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultSeasonalSubscriptionSegmentEngine } from "./seasonal-subscription-segment-engine.js";
import { newSeasonalSubscriptionSegment } from "./seasonal-subscription-segment.js";

test("SeasonalSubscriptionSegmentEngine keeps results within bounds", () => {
  const engine = defaultSeasonalSubscriptionSegmentEngine();
  const item = newSeasonalSubscriptionSegment("code-376", "name-860");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
