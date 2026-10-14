import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultScheduledTouchpointPreferenceEngine } from "./scheduled-touchpoint-preference-engine.js";
import { newScheduledTouchpointPreference } from "./scheduled-touchpoint-preference.js";

test("ScheduledTouchpointPreferenceEngine keeps results within bounds", () => {
  const engine = defaultScheduledTouchpointPreferenceEngine(flags.newRegistry());
  const item = newScheduledTouchpointPreference("code-118", "name-432");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
