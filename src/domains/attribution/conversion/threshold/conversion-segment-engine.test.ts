import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultConversionSegmentEngine } from "./conversion-segment-engine.js";
import { newConversionSegment } from "./conversion-segment.js";

test("ConversionSegmentEngine keeps results within bounds", () => {
  const engine = defaultConversionSegmentEngine();
  const item = newConversionSegment("code-232", "label-475");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
