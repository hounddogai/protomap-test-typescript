import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultFallbackSlaTemplateEngine } from "./fallback-sla-template-engine.js";
import { newFallbackSlaTemplate } from "./fallback-sla-template.js";

test("FallbackSlaTemplateEngine keeps results within bounds", () => {
  const engine = defaultFallbackSlaTemplateEngine(flags.newRegistry());
  const item = newFallbackSlaTemplate("code-690", "label-234");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
