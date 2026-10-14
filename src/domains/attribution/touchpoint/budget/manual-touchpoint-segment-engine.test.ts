import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultManualTouchpointSegmentEngine } from "./manual-touchpoint-segment-engine.js";
import { newManualTouchpointSegment } from "./manual-touchpoint-segment.js";

test("ManualTouchpointSegmentEngine keeps results within bounds", () => {
  const engine = defaultManualTouchpointSegmentEngine();
  const item = newManualTouchpointSegment("code-962", "title-544");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
