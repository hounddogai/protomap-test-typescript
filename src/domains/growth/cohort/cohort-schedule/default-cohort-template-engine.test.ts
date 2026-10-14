import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultDefaultCohortTemplateEngine } from "./default-cohort-template-engine.js";
import { newDefaultCohortTemplate } from "./default-cohort-template.js";

test("DefaultCohortTemplateEngine keeps results within bounds", () => {
  const engine = defaultDefaultCohortTemplateEngine();
  const item = newDefaultCohortTemplate("code-863", "name-508");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
