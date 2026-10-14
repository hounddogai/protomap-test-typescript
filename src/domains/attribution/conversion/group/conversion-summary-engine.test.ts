import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultConversionSummaryEngine } from "./conversion-summary-engine.js";
import { newConversionSummary } from "./conversion-summary.js";

test("ConversionSummaryEngine keeps results within bounds", () => {
  const engine = defaultConversionSummaryEngine(flags.newRegistry());
  const item = newConversionSummary("code-609", "label-507");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
