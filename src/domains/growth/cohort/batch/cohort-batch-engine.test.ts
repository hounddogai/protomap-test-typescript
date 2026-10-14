import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultCohortBatchEngine } from "./cohort-batch-engine.js";
import { newCohortBatch } from "./cohort-batch.js";

test("CohortBatchEngine keeps results within bounds", () => {
  const engine = defaultCohortBatchEngine(flags.newRegistry());
  const item = newCohortBatch("code-472", "name-693");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
