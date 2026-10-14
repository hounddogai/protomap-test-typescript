import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultModelTemplateEngine } from "./model-template-engine.js";
import { newModelTemplate } from "./model-template.js";

test("ModelTemplateEngine keeps results within bounds", () => {
  const engine = defaultModelTemplateEngine();
  const item = newModelTemplate("code-613", "name-345");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
