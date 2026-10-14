import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultLevelSegmentEngine } from "./level-segment-engine.js";
import { newLevelSegment } from "./level-segment.js";

test("LevelSegmentEngine keeps results within bounds", () => {
  const engine = defaultLevelSegmentEngine();
  const item = newLevelSegment("code-54", "label-625");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
