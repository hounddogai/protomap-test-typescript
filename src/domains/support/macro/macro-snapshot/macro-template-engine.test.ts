import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultMacroTemplateEngine } from "./macro-template-engine.js";
import { newMacroTemplate } from "./macro-template.js";

test("MacroTemplateEngine keeps results within bounds", () => {
  const engine = defaultMacroTemplateEngine(flags.newRegistry());
  const item = newMacroTemplate("code-592", "label-154");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
