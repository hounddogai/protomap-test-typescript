import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPreferenceTargetEngine } from "./preference-target-engine.js";
import { newPreferenceTarget } from "./preference-target.js";

test("PreferenceTargetEngine keeps results within bounds", () => {
  const engine = defaultPreferenceTargetEngine(flags.newRegistry());
  const item = newPreferenceTarget("code-383", "label-313");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
