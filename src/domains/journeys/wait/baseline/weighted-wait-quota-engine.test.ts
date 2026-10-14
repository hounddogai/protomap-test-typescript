import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultWeightedWaitQuotaEngine } from "./weighted-wait-quota-engine.js";
import { newWeightedWaitQuota } from "./weighted-wait-quota.js";

test("WeightedWaitQuotaEngine keeps results within bounds", () => {
  const engine = defaultWeightedWaitQuotaEngine(flags.newRegistry());
  const item = newWeightedWaitQuota("code-436", "name-972");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
