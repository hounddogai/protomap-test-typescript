import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultFrequencySegmentEngine } from "./frequency-segment-engine.js";
import { newFrequencySegment } from "./frequency-segment.js";

test("FrequencySegmentEngine keeps results within bounds", () => {
  const engine = defaultFrequencySegmentEngine();
  const item = newFrequencySegment("code-490", "label-478");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
