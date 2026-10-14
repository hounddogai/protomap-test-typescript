import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPreferenceTemplateEngine } from "./preference-template-engine.js";
import { newPreferenceTemplate } from "./preference-template.js";

test("PreferenceTemplateEngine keeps results within bounds", () => {
  const engine = defaultPreferenceTemplateEngine(flags.newRegistry());
  const item = newPreferenceTemplate("code-682", "label-248");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
