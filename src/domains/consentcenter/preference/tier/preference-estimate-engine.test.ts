import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPreferenceEstimateEngine } from "./preference-estimate-engine.js";
import { newPreferenceEstimate } from "./preference-estimate.js";

test("PreferenceEstimateEngine keeps results within bounds", () => {
  const engine = defaultPreferenceEstimateEngine(flags.newRegistry());
  const item = newPreferenceEstimate("code-353", "title-863");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
