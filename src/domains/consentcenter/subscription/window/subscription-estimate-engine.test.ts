import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultSubscriptionEstimateEngine } from "./subscription-estimate-engine.js";
import { newSubscriptionEstimate } from "./subscription-estimate.js";

test("SubscriptionEstimateEngine keeps results within bounds", () => {
  const engine = defaultSubscriptionEstimateEngine();
  const item = newSubscriptionEstimate("code-560", "name-164");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
