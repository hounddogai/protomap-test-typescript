import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultFunnelSummaryEngine } from "./funnel-summary-engine.js";
import { newFunnelSummary } from "./funnel-summary.js";

test("FunnelSummaryEngine keeps results within bounds", () => {
  const engine = defaultFunnelSummaryEngine(flags.newRegistry());
  const item = newFunnelSummary("code-633", "name-140");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
