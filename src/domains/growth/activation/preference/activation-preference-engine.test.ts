import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultActivationPreferenceEngine } from "./activation-preference-engine.js";
import { newActivationPreference } from "./activation-preference.js";

test("ActivationPreferenceEngine keeps results within bounds", () => {
  const engine = defaultActivationPreferenceEngine();
  const item = newActivationPreference("code-575", "title-310");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
