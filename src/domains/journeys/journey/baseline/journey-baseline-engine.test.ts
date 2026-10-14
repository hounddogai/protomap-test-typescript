import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultJourneyBaselineEngine } from "./journey-baseline-engine.js";
import { newJourneyBaseline } from "./journey-baseline.js";

test("JourneyBaselineEngine keeps results within bounds", () => {
  const engine = defaultJourneyBaselineEngine(flags.newRegistry());
  const item = newJourneyBaseline("code-906", "title-96");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
