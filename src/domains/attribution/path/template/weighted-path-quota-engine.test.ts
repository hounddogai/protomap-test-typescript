import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultWeightedPathQuotaEngine } from "./weighted-path-quota-engine.js";
import { newWeightedPathQuota } from "./weighted-path-quota.js";

test("WeightedPathQuotaEngine keeps results within bounds", () => {
  const engine = defaultWeightedPathQuotaEngine();
  const item = newWeightedPathQuota("code-123", "title-328");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
