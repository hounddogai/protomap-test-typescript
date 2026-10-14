import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultScheduledCohortOverrideEngine } from "./scheduled-cohort-override-engine.js";
import { newScheduledCohortOverride } from "./scheduled-cohort-override.js";

test("ScheduledCohortOverrideEngine keeps results within bounds", () => {
  const engine = defaultScheduledCohortOverrideEngine();
  const item = newScheduledCohortOverride("code-918", "title-110");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
