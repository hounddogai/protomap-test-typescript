import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultMacroPreferenceEngine } from "./macro-preference-engine.js";
import { newMacroPreference } from "./macro-preference.js";

test("MacroPreferenceEngine keeps results within bounds", () => {
  const engine = defaultMacroPreferenceEngine(flags.newRegistry());
  const item = newMacroPreference("code-215", "label-177");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
