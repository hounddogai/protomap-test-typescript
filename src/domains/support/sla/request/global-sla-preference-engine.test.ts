import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultGlobalSlaPreferenceEngine } from "./global-sla-preference-engine.js";
import { newGlobalSlaPreference } from "./global-sla-preference.js";

test("GlobalSlaPreferenceEngine keeps results within bounds", () => {
  const engine = defaultGlobalSlaPreferenceEngine();
  const item = newGlobalSlaPreference("code-149", "label-917");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
