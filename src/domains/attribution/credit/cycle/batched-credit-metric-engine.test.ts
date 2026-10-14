import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultBatchedCreditMetricEngine } from "./batched-credit-metric-engine.js";
import { newBatchedCreditMetric } from "./batched-credit-metric.js";

test("BatchedCreditMetricEngine keeps results within bounds", () => {
  const engine = defaultBatchedCreditMetricEngine(flags.newRegistry());
  const item = newBatchedCreditMetric("code-762", "title-903");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
