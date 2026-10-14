import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultGlobalCohortEntryEngine } from "./global-cohort-entry-engine.js";
import { newGlobalCohortEntry } from "./global-cohort-entry.js";

test("GlobalCohortEntryEngine keeps results within bounds", () => {
  const engine = defaultGlobalCohortEntryEngine(flags.newRegistry());
  const item = newGlobalCohortEntry("code-95", "name-476");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
