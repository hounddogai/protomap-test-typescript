import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultLevelPreferenceEngine } from "./level-preference-engine.js";
import { newLevelPreference } from "./level-preference.js";

test("LevelPreferenceEngine keeps results within bounds", () => {
  const engine = defaultLevelPreferenceEngine();
  const item = newLevelPreference("code-20", "title-379");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
