import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultCohortWindowEngine } from "./cohort-window-engine.js";
import { newCohortWindow } from "./cohort-window.js";

test("CohortWindowEngine keeps results within bounds", () => {
  const engine = defaultCohortWindowEngine();
  const item = newCohortWindow("code-121", "name-1");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
