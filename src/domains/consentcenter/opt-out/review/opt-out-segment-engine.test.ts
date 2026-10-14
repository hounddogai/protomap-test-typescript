import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultOptOutSegmentEngine } from "./opt-out-segment-engine.js";
import { newOptOutSegment } from "./opt-out-segment.js";

test("OptOutSegmentEngine keeps results within bounds", () => {
  const engine = defaultOptOutSegmentEngine(flags.newRegistry());
  const item = newOptOutSegment("code-26", "title-157");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
