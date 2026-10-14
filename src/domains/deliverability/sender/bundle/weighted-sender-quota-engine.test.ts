import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultWeightedSenderQuotaEngine } from "./weighted-sender-quota-engine.js";
import { newWeightedSenderQuota } from "./weighted-sender-quota.js";

test("WeightedSenderQuotaEngine keeps results within bounds", () => {
  const engine = defaultWeightedSenderQuotaEngine(flags.newRegistry());
  const item = newWeightedSenderQuota("code-297", "title-506");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
