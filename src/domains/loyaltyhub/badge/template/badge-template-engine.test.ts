import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultBadgeTemplateEngine } from "./badge-template-engine.js";
import { newBadgeTemplate } from "./badge-template.js";

test("BadgeTemplateEngine keeps results within bounds", () => {
  const engine = defaultBadgeTemplateEngine(flags.newRegistry());
  const item = newBadgeTemplate("code-698", "name-472");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
