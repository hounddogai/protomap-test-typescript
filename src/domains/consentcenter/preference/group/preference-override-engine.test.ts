import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPreferenceOverrideEngine } from "./preference-override-engine.js";
import { newPreferenceOverride } from "./preference-override.js";

test("PreferenceOverrideEngine keeps results within bounds", () => {
  const engine = defaultPreferenceOverrideEngine(flags.newRegistry());
  const item = newPreferenceOverride("code-751", "label-821");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
