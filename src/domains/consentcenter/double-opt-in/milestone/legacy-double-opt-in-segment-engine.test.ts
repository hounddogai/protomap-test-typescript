import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLegacyDoubleOptInSegmentEngine } from "./legacy-double-opt-in-segment-engine.js";
import { newLegacyDoubleOptInSegment } from "./legacy-double-opt-in-segment.js";

test("LegacyDoubleOptInSegmentEngine keeps results within bounds", () => {
  const engine = defaultLegacyDoubleOptInSegmentEngine(flags.newRegistry());
  const item = newLegacyDoubleOptInSegment("code-773", "title-159");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
