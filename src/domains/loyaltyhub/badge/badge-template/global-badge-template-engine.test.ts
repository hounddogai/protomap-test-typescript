import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultGlobalBadgeTemplateEngine } from "./global-badge-template-engine.js";
import { newGlobalBadgeTemplate } from "./global-badge-template.js";

test("GlobalBadgeTemplateEngine keeps results within bounds", () => {
  const engine = defaultGlobalBadgeTemplateEngine();
  const item = newGlobalBadgeTemplate("code-242", "label-978");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
