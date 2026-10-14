import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRollingTouchpointTemplateEngine } from "./rolling-touchpoint-template-engine.js";
import { newRollingTouchpointTemplate } from "./rolling-touchpoint-template.js";

test("RollingTouchpointTemplateEngine keeps results within bounds", () => {
  const engine = defaultRollingTouchpointTemplateEngine(flags.newRegistry());
  const item = newRollingTouchpointTemplate("code-538", "title-44");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
