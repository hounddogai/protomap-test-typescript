import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultSeasonalFrequencyPolicyEngine } from "./seasonal-frequency-policy-engine.js";
import { newSeasonalFrequencyPolicy } from "./seasonal-frequency-policy.js";

test("SeasonalFrequencyPolicyEngine keeps results within bounds", () => {
  const engine = defaultSeasonalFrequencyPolicyEngine();
  const item = newSeasonalFrequencyPolicy("code-142", "label-51");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
