import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultSeasonalPlacementPreferenceEngine } from "./seasonal-placement-preference-engine.js";
import { newSeasonalPlacementPreference } from "./seasonal-placement-preference.js";

test("SeasonalPlacementPreferenceEngine keeps results within bounds", () => {
  const engine = defaultSeasonalPlacementPreferenceEngine(flags.newRegistry());
  const item = newSeasonalPlacementPreference("code-758", "title-69");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
