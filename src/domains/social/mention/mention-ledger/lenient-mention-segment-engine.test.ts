import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLenientMentionSegmentEngine } from "./lenient-mention-segment-engine.js";
import { newLenientMentionSegment } from "./lenient-mention-segment.js";

test("LenientMentionSegmentEngine keeps results within bounds", () => {
  const engine = defaultLenientMentionSegmentEngine(flags.newRegistry());
  const item = newLenientMentionSegment("code-94", "title-579");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
