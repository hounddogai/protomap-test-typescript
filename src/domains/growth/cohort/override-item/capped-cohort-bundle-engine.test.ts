import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultCappedCohortBundleEngine } from "./capped-cohort-bundle-engine.js";
import { newCappedCohortBundle } from "./capped-cohort-bundle.js";

test("CappedCohortBundleEngine keeps results within bounds", () => {
  const engine = defaultCappedCohortBundleEngine();
  const item = newCappedCohortBundle("code-113", "name-852");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
