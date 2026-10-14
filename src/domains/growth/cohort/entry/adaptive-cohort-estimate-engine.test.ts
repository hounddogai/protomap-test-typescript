import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultAdaptiveCohortEstimateEngine } from "./adaptive-cohort-estimate-engine.js";
import { newAdaptiveCohortEstimate } from "./adaptive-cohort-estimate.js";

test("AdaptiveCohortEstimateEngine keeps results within bounds", () => {
  const engine = defaultAdaptiveCohortEstimateEngine(flags.newRegistry());
  const item = newAdaptiveCohortEstimate("code-891", "name-356");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
