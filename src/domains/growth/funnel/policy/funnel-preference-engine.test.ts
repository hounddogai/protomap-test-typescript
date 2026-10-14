import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultFunnelPreferenceEngine } from "./funnel-preference-engine.js";
import { newFunnelPreference } from "./funnel-preference.js";

test("FunnelPreferenceEngine keeps results within bounds", () => {
  const engine = defaultFunnelPreferenceEngine(flags.newRegistry());
  const item = newFunnelPreference("code-361", "name-932");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
