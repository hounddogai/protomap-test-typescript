import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultSeasonalSuppressionSegmentEngine } from "./seasonal-suppression-segment-engine.js";
import { newSeasonalSuppressionSegment } from "./seasonal-suppression-segment.js";

test("SeasonalSuppressionSegmentEngine keeps results within bounds", () => {
  const engine = defaultSeasonalSuppressionSegmentEngine(flags.newRegistry());
  const item = newSeasonalSuppressionSegment("code-205", "title-88");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
