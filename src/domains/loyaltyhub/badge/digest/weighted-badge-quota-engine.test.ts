import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultWeightedBadgeQuotaEngine } from "./weighted-badge-quota-engine.js";
import { newWeightedBadgeQuota } from "./weighted-badge-quota.js";

test("WeightedBadgeQuotaEngine keeps results within bounds", () => {
  const engine = defaultWeightedBadgeQuotaEngine();
  const item = newWeightedBadgeQuota("code-140", "name-684");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
