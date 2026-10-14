import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultDefaultActivationTemplateEngine } from "./default-activation-template-engine.js";
import { newDefaultActivationTemplate } from "./default-activation-template.js";

test("DefaultActivationTemplateEngine keeps results within bounds", () => {
  const engine = defaultDefaultActivationTemplateEngine(flags.newRegistry());
  const item = newDefaultActivationTemplate("code-600", "title-496");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
