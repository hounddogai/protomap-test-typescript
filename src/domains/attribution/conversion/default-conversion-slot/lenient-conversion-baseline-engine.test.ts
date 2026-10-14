import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLenientConversionBaselineEngine } from "./lenient-conversion-baseline-engine.js";
import { newLenientConversionBaseline } from "./lenient-conversion-baseline.js";

test("LenientConversionBaselineEngine keeps results within bounds", () => {
  const engine = defaultLenientConversionBaselineEngine(flags.newRegistry());
  const item = newLenientConversionBaseline("code-842", "label-991");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
