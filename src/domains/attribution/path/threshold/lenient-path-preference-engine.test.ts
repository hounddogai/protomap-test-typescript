import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultLenientPathPreferenceEngine } from "./lenient-path-preference-engine.js";
import { newLenientPathPreference } from "./lenient-path-preference.js";

test("LenientPathPreferenceEngine keeps results within bounds", () => {
  const engine = defaultLenientPathPreferenceEngine();
  const item = newLenientPathPreference("code-760", "name-537");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
