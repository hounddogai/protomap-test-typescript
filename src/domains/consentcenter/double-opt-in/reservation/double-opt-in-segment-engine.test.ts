import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultDoubleOptInSegmentEngine } from "./double-opt-in-segment-engine.js";
import { newDoubleOptInSegment } from "./double-opt-in-segment.js";

test("DoubleOptInSegmentEngine keeps results within bounds", () => {
  const engine = defaultDoubleOptInSegmentEngine(flags.newRegistry());
  const item = newDoubleOptInSegment("code-792", "name-537");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
