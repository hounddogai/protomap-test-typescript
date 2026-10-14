import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultScheduledCreativePreferenceEngine } from "./scheduled-creative-preference-engine.js";
import { newScheduledCreativePreference } from "./scheduled-creative-preference.js";

test("ScheduledCreativePreferenceEngine keeps results within bounds", () => {
  const engine = defaultScheduledCreativePreferenceEngine(flags.newRegistry());
  const item = newScheduledCreativePreference("code-900", "label-582");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
