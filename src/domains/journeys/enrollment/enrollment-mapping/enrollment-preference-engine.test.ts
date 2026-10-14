import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultEnrollmentPreferenceEngine } from "./enrollment-preference-engine.js";
import { newEnrollmentPreference } from "./enrollment-preference.js";

test("EnrollmentPreferenceEngine keeps results within bounds", () => {
  const engine = defaultEnrollmentPreferenceEngine(flags.newRegistry());
  const item = newEnrollmentPreference("code-215", "title-521");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
