import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultBatchedRetentionSegmentEngine } from "./batched-retention-segment-engine.js";
import { newBatchedRetentionSegment } from "./batched-retention-segment.js";

test("BatchedRetentionSegmentEngine keeps results within bounds", () => {
  const engine = defaultBatchedRetentionSegmentEngine(flags.newRegistry());
  const item = newBatchedRetentionSegment("code-350", "name-429");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
