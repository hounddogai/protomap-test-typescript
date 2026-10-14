import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultTieredCohortQuotaEngine } from "./tiered-cohort-quota-engine.js";
import { newTieredCohortQuota } from "./tiered-cohort-quota.js";

test("TieredCohortQuotaEngine keeps results within bounds", () => {
  const engine = defaultTieredCohortQuotaEngine(flags.newRegistry());
  const item = newTieredCohortQuota("code-997", "title-277");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
