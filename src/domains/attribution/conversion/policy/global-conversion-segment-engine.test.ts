import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultGlobalConversionSegmentEngine } from "./global-conversion-segment-engine.js";
import { newGlobalConversionSegment } from "./global-conversion-segment.js";

test("GlobalConversionSegmentEngine keeps results within bounds", () => {
  const engine = defaultGlobalConversionSegmentEngine(flags.newRegistry());
  const item = newGlobalConversionSegment("code-972", "title-974");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
