import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultSlaPreferenceEngine } from "./sla-preference-engine.js";
import { newSlaPreference } from "./sla-preference.js";

test("SlaPreferenceEngine keeps results within bounds", () => {
  const engine = defaultSlaPreferenceEngine();
  const item = newSlaPreference("code-56", "label-201");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
