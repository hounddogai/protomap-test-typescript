import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultReputationTemplateEngine } from "./reputation-template-engine.js";
import { newReputationTemplate } from "./reputation-template.js";

test("ReputationTemplateEngine keeps results within bounds", () => {
  const engine = defaultReputationTemplateEngine();
  const item = newReputationTemplate("code-526", "title-875");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
