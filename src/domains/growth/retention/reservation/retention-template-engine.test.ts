import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRetentionTemplateEngine } from "./retention-template-engine.js";
import { newRetentionTemplate } from "./retention-template.js";

test("RetentionTemplateEngine keeps results within bounds", () => {
  const engine = defaultRetentionTemplateEngine(flags.newRegistry());
  const item = newRetentionTemplate("code-23", "name-984");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
