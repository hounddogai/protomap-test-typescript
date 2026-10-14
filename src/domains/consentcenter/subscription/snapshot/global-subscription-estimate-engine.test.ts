import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultGlobalSubscriptionEstimateEngine } from "./global-subscription-estimate-engine.js";
import { newGlobalSubscriptionEstimate } from "./global-subscription-estimate.js";

test("GlobalSubscriptionEstimateEngine keeps results within bounds", () => {
  const engine = defaultGlobalSubscriptionEstimateEngine(flags.newRegistry());
  const item = newGlobalSubscriptionEstimate("code-486", "name-63");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
