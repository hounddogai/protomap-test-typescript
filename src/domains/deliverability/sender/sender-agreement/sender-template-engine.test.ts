import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultSenderTemplateEngine } from "./sender-template-engine.js";
import { newSenderTemplate } from "./sender-template.js";

test("SenderTemplateEngine keeps results within bounds", () => {
  const engine = defaultSenderTemplateEngine(flags.newRegistry());
  const item = newSenderTemplate("code-968", "name-668");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
