import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultInsightSegmentEngine } from "./insight-segment-engine.js";
import { newInsightSegment } from "./insight-segment.js";

test("InsightSegmentEngine keeps results within bounds", () => {
  const engine = defaultInsightSegmentEngine(flags.newRegistry());
  const item = newInsightSegment("code-835", "title-302");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
