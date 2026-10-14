import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultBadgePreferenceEngine } from "./badge-preference-engine.js";
import { newBadgePreference } from "./badge-preference.js";

test("BadgePreferenceEngine keeps results within bounds", () => {
  const engine = defaultBadgePreferenceEngine();
  const item = newBadgePreference("code-573", "label-335");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
