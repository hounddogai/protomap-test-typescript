import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPreferenceMappingEngine } from "./preference-mapping-engine.js";
import { newPreferenceMapping } from "./preference-mapping.js";

test("PreferenceMappingEngine keeps results within bounds", () => {
  const engine = defaultPreferenceMappingEngine(flags.newRegistry());
  const item = newPreferenceMapping("code-777", "name-352");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
