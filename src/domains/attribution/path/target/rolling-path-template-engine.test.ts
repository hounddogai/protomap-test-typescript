import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRollingPathTemplateEngine } from "./rolling-path-template-engine.js";
import { newRollingPathTemplate } from "./rolling-path-template.js";

test("RollingPathTemplateEngine keeps results within bounds", () => {
  const engine = defaultRollingPathTemplateEngine(flags.newRegistry());
  const item = newRollingPathTemplate("code-729", "name-297");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
