import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultSuppressionTemplateEngine } from "./suppression-template-engine.js";
import { newSuppressionTemplate } from "./suppression-template.js";

test("SuppressionTemplateEngine keeps results within bounds", () => {
  const engine = defaultSuppressionTemplateEngine();
  const item = newSuppressionTemplate("code-164", "name-246");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
