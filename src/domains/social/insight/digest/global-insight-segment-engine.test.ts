import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultGlobalInsightSegmentEngine } from "./global-insight-segment-engine.js";
import { newGlobalInsightSegment } from "./global-insight-segment.js";

test("GlobalInsightSegmentEngine keeps results within bounds", () => {
  const engine = defaultGlobalInsightSegmentEngine();
  const item = newGlobalInsightSegment("code-84", "label-329");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
