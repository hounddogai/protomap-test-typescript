import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLenientPacingSegmentEngine } from "./lenient-pacing-segment-engine.js";
import { newLenientPacingSegment } from "./lenient-pacing-segment.js";

test("LenientPacingSegmentEngine keeps results within bounds", () => {
  const engine = defaultLenientPacingSegmentEngine(flags.newRegistry());
  const item = newLenientPacingSegment("code-216", "title-329");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
