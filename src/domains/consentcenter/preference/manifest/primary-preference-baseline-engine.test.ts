import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPrimaryPreferenceBaselineEngine } from "./primary-preference-baseline-engine.js";
import { newPrimaryPreferenceBaseline } from "./primary-preference-baseline.js";

test("PrimaryPreferenceBaselineEngine keeps results within bounds", () => {
  const engine = defaultPrimaryPreferenceBaselineEngine(flags.newRegistry());
  const item = newPrimaryPreferenceBaseline("code-563", "title-910");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
