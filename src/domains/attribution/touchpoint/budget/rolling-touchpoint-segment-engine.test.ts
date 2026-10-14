import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRollingTouchpointSegmentEngine } from "./rolling-touchpoint-segment-engine.js";
import { newRollingTouchpointSegment } from "./rolling-touchpoint-segment.js";

test("RollingTouchpointSegmentEngine keeps results within bounds", () => {
  const engine = defaultRollingTouchpointSegmentEngine(flags.newRegistry());
  const item = newRollingTouchpointSegment("code-772", "name-806");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
