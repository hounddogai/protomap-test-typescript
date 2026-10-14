import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultTieredCohortAdjustmentEngine } from "./tiered-cohort-adjustment-engine.js";
import { newTieredCohortAdjustment } from "./tiered-cohort-adjustment.js";

test("TieredCohortAdjustmentEngine keeps results within bounds", () => {
  const engine = defaultTieredCohortAdjustmentEngine(flags.newRegistry());
  const item = newTieredCohortAdjustment("code-301", "name-698");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
