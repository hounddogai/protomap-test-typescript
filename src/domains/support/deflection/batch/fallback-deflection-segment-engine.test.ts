import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultFallbackDeflectionSegmentEngine } from "./fallback-deflection-segment-engine.js";
import { newFallbackDeflectionSegment } from "./fallback-deflection-segment.js";

test("FallbackDeflectionSegmentEngine keeps results within bounds", () => {
  const engine = defaultFallbackDeflectionSegmentEngine(flags.newRegistry());
  const item = newFallbackDeflectionSegment("code-471", "name-336");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
