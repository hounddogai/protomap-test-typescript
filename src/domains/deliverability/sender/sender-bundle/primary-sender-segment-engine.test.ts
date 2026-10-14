import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPrimarySenderSegmentEngine } from "./primary-sender-segment-engine.js";
import { newPrimarySenderSegment } from "./primary-sender-segment.js";

test("PrimarySenderSegmentEngine keeps results within bounds", () => {
  const engine = defaultPrimarySenderSegmentEngine();
  const item = newPrimarySenderSegment("code-667", "label-978");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
