import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultCohortQuotaEngine } from "./cohort-quota-engine.js";
import { newCohortQuota } from "./cohort-quota.js";

test("CohortQuotaEngine keeps results within bounds", () => {
  const engine = defaultCohortQuotaEngine(flags.newRegistry());
  const item = newCohortQuota("code-915", "name-516");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
