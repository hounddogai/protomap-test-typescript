import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultDefaultRewardSegmentEngine } from "./default-reward-segment-engine.js";
import { newDefaultRewardSegment } from "./default-reward-segment.js";

test("DefaultRewardSegmentEngine keeps results within bounds", () => {
  const engine = defaultDefaultRewardSegmentEngine(flags.newRegistry());
  const item = newDefaultRewardSegment("code-464", "title-301");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
