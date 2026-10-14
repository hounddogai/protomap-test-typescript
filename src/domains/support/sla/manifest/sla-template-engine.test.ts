import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultSlaTemplateEngine } from "./sla-template-engine.js";
import { newSlaTemplate } from "./sla-template.js";

test("SlaTemplateEngine keeps results within bounds", () => {
  const engine = defaultSlaTemplateEngine(flags.newRegistry());
  const item = newSlaTemplate("code-698", "label-321");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
