import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultCreativeTemplateEngine } from "./creative-template-engine.js";
import { newCreativeTemplate } from "./creative-template.js";

test("CreativeTemplateEngine keeps results within bounds", () => {
  const engine = defaultCreativeTemplateEngine();
  const item = newCreativeTemplate("code-756", "name-322");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
