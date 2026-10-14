import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultSeasonalPreferenceThresholdEngine } from "./seasonal-preference-threshold-engine.js";
import { newSeasonalPreferenceThreshold } from "./seasonal-preference-threshold.js";

test("SeasonalPreferenceThresholdEngine keeps results within bounds", () => {
  const engine = defaultSeasonalPreferenceThresholdEngine(flags.newRegistry());
  const item = newSeasonalPreferenceThreshold("code-720", "label-399");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
