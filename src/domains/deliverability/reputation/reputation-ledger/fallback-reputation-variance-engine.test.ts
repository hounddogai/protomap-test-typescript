import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultFallbackReputationVarianceEngine } from "./fallback-reputation-variance-engine.js";
import { newFallbackReputationVariance } from "./fallback-reputation-variance.js";

test("FallbackReputationVarianceEngine keeps results within bounds", () => {
  const engine = defaultFallbackReputationVarianceEngine(flags.newRegistry());
  const item = newFallbackReputationVariance("code-193", "label-364");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
