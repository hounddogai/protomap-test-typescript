import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPrimaryJourneySummaryEngine } from "./primary-journey-summary-engine.js";
import { newPrimaryJourneySummary } from "./primary-journey-summary.js";

test("PrimaryJourneySummaryEngine keeps results within bounds", () => {
  const engine = defaultPrimaryJourneySummaryEngine(flags.newRegistry());
  const item = newPrimaryJourneySummary("code-816", "label-581");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
