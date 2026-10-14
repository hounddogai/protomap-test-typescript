import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultScheduledPostTemplateEngine } from "./scheduled-post-template-engine.js";
import { newScheduledPostTemplate } from "./scheduled-post-template.js";

test("ScheduledPostTemplateEngine keeps results within bounds", () => {
  const engine = defaultScheduledPostTemplateEngine();
  const item = newScheduledPostTemplate("code-908", "label-671");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
