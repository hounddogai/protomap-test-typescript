import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultCreativePreferenceEngine } from "./creative-preference-engine.js";
import { newCreativePreference } from "./creative-preference.js";

test("CreativePreferenceEngine keeps results within bounds", () => {
  const engine = defaultCreativePreferenceEngine();
  const item = newCreativePreference("code-753", "label-813");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
