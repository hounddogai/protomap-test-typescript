import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPathPreferenceEngine } from "./path-preference-engine.js";
import { newPathPreference } from "./path-preference.js";

test("PathPreferenceEngine keeps results within bounds", () => {
  const engine = defaultPathPreferenceEngine(flags.newRegistry());
  const item = newPathPreference("code-983", "title-620");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
