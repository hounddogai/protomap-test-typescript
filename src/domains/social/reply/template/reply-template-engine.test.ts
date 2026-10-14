import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultReplyTemplateEngine } from "./reply-template-engine.js";
import { newReplyTemplate } from "./reply-template.js";

test("ReplyTemplateEngine keeps results within bounds", () => {
  const engine = defaultReplyTemplateEngine();
  const item = newReplyTemplate("code-627", "label-296");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
