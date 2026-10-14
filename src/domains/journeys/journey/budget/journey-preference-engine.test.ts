import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultJourneyPreferenceEngine } from "./journey-preference-engine.js";
import { newJourneyPreference } from "./journey-preference.js";

test("JourneyPreferenceEngine keeps results within bounds", () => {
  const engine = defaultJourneyPreferenceEngine(flags.newRegistry());
  const item = newJourneyPreference("code-42", "title-324");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
