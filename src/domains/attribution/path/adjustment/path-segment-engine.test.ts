import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPathSegmentEngine } from "./path-segment-engine.js";
import { newPathSegment } from "./path-segment.js";

test("PathSegmentEngine keeps results within bounds", () => {
  const engine = defaultPathSegmentEngine(flags.newRegistry());
  const item = newPathSegment("code-602", "title-960");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
