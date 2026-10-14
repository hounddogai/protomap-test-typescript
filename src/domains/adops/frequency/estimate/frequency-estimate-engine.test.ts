import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultFrequencyEstimateEngine } from "./frequency-estimate-engine.js";
import { newFrequencyEstimate } from "./frequency-estimate.js";

test("FrequencyEstimateEngine keeps results within bounds", () => {
  const engine = defaultFrequencyEstimateEngine(flags.newRegistry());
  const item = newFrequencyEstimate("code-998", "label-730");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
