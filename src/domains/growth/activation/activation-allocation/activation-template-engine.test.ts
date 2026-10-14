import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultActivationTemplateEngine } from "./activation-template-engine.js";
import { newActivationTemplate } from "./activation-template.js";

test("ActivationTemplateEngine keeps results within bounds", () => {
  const engine = defaultActivationTemplateEngine(flags.newRegistry());
  const item = newActivationTemplate("code-198", "name-829");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
