import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRollingRetentionTemplateEngine } from "./rolling-retention-template-engine.js";
import { newRollingRetentionTemplate } from "./rolling-retention-template.js";

test("RollingRetentionTemplateEngine keeps results within bounds", () => {
  const engine = defaultRollingRetentionTemplateEngine(flags.newRegistry());
  const item = newRollingRetentionTemplate("code-751", "title-322");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
