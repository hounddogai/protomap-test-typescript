import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRollingConversionPreferenceEngine } from "./rolling-conversion-preference-engine.js";
import { newRollingConversionPreference } from "./rolling-conversion-preference.js";

test("RollingConversionPreferenceEngine keeps results within bounds", () => {
  const engine = defaultRollingConversionPreferenceEngine(flags.newRegistry());
  const item = newRollingConversionPreference("code-432", "label-452");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
