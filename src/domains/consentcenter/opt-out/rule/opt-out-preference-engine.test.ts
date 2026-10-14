import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultOptOutPreferenceEngine } from "./opt-out-preference-engine.js";
import { newOptOutPreference } from "./opt-out-preference.js";

test("OptOutPreferenceEngine keeps results within bounds", () => {
  const engine = defaultOptOutPreferenceEngine(flags.newRegistry());
  const item = newOptOutPreference("code-91", "label-284");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
