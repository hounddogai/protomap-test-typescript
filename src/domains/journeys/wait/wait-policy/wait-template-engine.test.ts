import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultWaitTemplateEngine } from "./wait-template-engine.js";
import { newWaitTemplate } from "./wait-template.js";

test("WaitTemplateEngine keeps results within bounds", () => {
  const engine = defaultWaitTemplateEngine();
  const item = newWaitTemplate("code-404", "title-583");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
