import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPrimaryCohortAdjustmentEngine } from "./primary-cohort-adjustment-engine.js";
import { newPrimaryCohortAdjustment } from "./primary-cohort-adjustment.js";

test("PrimaryCohortAdjustmentEngine keeps results within bounds", () => {
  const engine = defaultPrimaryCohortAdjustmentEngine(flags.newRegistry());
  const item = newPrimaryCohortAdjustment("code-898", "label-82");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
