import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultCohortBaselineEngine } from "./cohort-baseline-engine.js";
import { newCohortBaseline } from "./cohort-baseline.js";

test("CohortBaselineEngine keeps results within bounds", () => {
  const engine = defaultCohortBaselineEngine();
  const item = newCohortBaseline("code-472", "title-984");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
