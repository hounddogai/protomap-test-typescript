import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPrimaryPreferenceTargetEngine } from "./primary-preference-target-engine.js";
import { newPrimaryPreferenceTarget } from "./primary-preference-target.js";

test("PrimaryPreferenceTargetEngine keeps results within bounds", () => {
  const engine = defaultPrimaryPreferenceTargetEngine(flags.newRegistry());
  const item = newPrimaryPreferenceTarget("code-757", "title-250");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
