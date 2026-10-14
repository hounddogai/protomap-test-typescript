import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultWindowSegmentEngine } from "./window-segment-engine.js";
import { newWindowSegment } from "./window-segment.js";

test("WindowSegmentEngine keeps results within bounds", () => {
  const engine = defaultWindowSegmentEngine();
  const item = newWindowSegment("code-983", "name-245");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
