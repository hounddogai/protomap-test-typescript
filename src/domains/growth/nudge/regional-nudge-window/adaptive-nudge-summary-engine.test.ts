import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultAdaptiveNudgeSummaryEngine } from "./adaptive-nudge-summary-engine.js";
import { newAdaptiveNudgeSummary } from "./adaptive-nudge-summary.js";

test("AdaptiveNudgeSummaryEngine keeps results within bounds", () => {
  const engine = defaultAdaptiveNudgeSummaryEngine(flags.newRegistry());
  const item = newAdaptiveNudgeSummary("code-41", "title-542");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
