import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultStrictCohortProfileEngine } from "./strict-cohort-profile-engine.js";
import { newStrictCohortProfile } from "./strict-cohort-profile.js";

test("StrictCohortProfileEngine keeps results within bounds", () => {
  const engine = defaultStrictCohortProfileEngine();
  const item = newStrictCohortProfile("code-471", "name-806");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
