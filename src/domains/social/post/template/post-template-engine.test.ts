import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPostTemplateEngine } from "./post-template-engine.js";
import { newPostTemplate } from "./post-template.js";

test("PostTemplateEngine keeps results within bounds", () => {
  const engine = defaultPostTemplateEngine();
  const item = newPostTemplate("code-462", "name-693");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
