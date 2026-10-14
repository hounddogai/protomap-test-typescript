import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultLegacyInsightSegmentEngine } from "./legacy-insight-segment-engine.js";
import { newLegacyInsightSegment } from "./legacy-insight-segment.js";

test("LegacyInsightSegmentEngine keeps results within bounds", () => {
  const engine = defaultLegacyInsightSegmentEngine();
  const item = newLegacyInsightSegment("code-339", "title-362");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
