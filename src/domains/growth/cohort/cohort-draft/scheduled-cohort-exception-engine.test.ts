import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultScheduledCohortExceptionEngine } from "./scheduled-cohort-exception-engine.js";
import { newScheduledCohortException } from "./scheduled-cohort-exception.js";

test("ScheduledCohortExceptionEngine keeps results within bounds", () => {
  const engine = defaultScheduledCohortExceptionEngine(flags.newRegistry());
  const item = newScheduledCohortException("code-182", "name-742");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
