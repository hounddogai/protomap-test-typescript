import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultCsatSummaryEngine } from "./csat-summary-engine.js";
import { newCsatSummary } from "./csat-summary.js";

test("CsatSummaryEngine keeps results within bounds", () => {
  const engine = defaultCsatSummaryEngine(flags.newRegistry());
  const item = newCsatSummary("code-14", "label-628");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
