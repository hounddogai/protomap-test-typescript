import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultDomainTemplateEngine } from "./domain-template-engine.js";
import { newDomainTemplate } from "./domain-template.js";

test("DomainTemplateEngine keeps results within bounds", () => {
  const engine = defaultDomainTemplateEngine();
  const item = newDomainTemplate("code-453", "label-311");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
