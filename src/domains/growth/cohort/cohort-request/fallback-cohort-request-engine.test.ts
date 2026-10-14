import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultFallbackCohortRequestEngine } from "./fallback-cohort-request-engine.js";
import { newFallbackCohortRequest } from "./fallback-cohort-request.js";

test("FallbackCohortRequestEngine keeps results within bounds", () => {
  const engine = defaultFallbackCohortRequestEngine(flags.newRegistry());
  const item = newFallbackCohortRequest("code-63", "name-953");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
