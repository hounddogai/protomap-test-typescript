import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultScheduledMacroTemplateEngine } from "./scheduled-macro-template-engine.js";
import { newScheduledMacroTemplate } from "./scheduled-macro-template.js";

test("ScheduledMacroTemplateEngine keeps results within bounds", () => {
  const engine = defaultScheduledMacroTemplateEngine();
  const item = newScheduledMacroTemplate("code-447", "name-825");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
