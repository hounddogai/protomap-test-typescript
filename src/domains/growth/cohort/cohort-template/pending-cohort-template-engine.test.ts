import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPendingCohortTemplateEngine } from "./pending-cohort-template-engine.js";
import { newPendingCohortTemplate } from "./pending-cohort-template.js";

test("PendingCohortTemplateEngine keeps results within bounds", () => {
  const engine = defaultPendingCohortTemplateEngine(flags.newRegistry());
  const item = newPendingCohortTemplate("code-217", "name-653");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
