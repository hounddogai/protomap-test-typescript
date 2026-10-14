import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultCsatPreferenceEngine } from "./csat-preference-engine.js";
import { newCsatPreference } from "./csat-preference.js";

test("CsatPreferenceEngine keeps results within bounds", () => {
  const engine = defaultCsatPreferenceEngine();
  const item = newCsatPreference("code-351", "label-388");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
