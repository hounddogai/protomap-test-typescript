import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultQueueTemplateEngine } from "./queue-template-engine.js";
import { newQueueTemplate } from "./queue-template.js";

test("QueueTemplateEngine keeps results within bounds", () => {
  const engine = defaultQueueTemplateEngine();
  const item = newQueueTemplate("code-11", "title-734");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
