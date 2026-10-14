import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPreferenceBundleEngine } from "./preference-bundle-engine.js";
import { newPreferenceBundle } from "./preference-bundle.js";

test("PreferenceBundleEngine keeps results within bounds", () => {
  const engine = defaultPreferenceBundleEngine();
  const item = newPreferenceBundle("code-222", "label-309");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
