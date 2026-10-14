import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultCohortEntryEngine } from "./cohort-entry-engine.js";
import { newCohortEntry } from "./cohort-entry.js";

test("CohortEntryEngine keeps results within bounds", () => {
  const engine = defaultCohortEntryEngine(flags.newRegistry());
  const item = newCohortEntry("code-298", "label-676");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
