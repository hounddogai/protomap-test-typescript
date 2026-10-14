import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultDefaultMacroSegmentEngine } from "./default-macro-segment-engine.js";
import { newDefaultMacroSegment } from "./default-macro-segment.js";

test("DefaultMacroSegmentEngine keeps results within bounds", () => {
  const engine = defaultDefaultMacroSegmentEngine(flags.newRegistry());
  const item = newDefaultMacroSegment("code-511", "label-787");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
