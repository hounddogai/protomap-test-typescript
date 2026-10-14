import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultStrictCohortTemplateEngine } from "./strict-cohort-template-engine.js";
import { newStrictCohortTemplate } from "./strict-cohort-template.js";

test("StrictCohortTemplateEngine keeps results within bounds", () => {
  const engine = defaultStrictCohortTemplateEngine();
  const item = newStrictCohortTemplate("code-787", "name-786");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
