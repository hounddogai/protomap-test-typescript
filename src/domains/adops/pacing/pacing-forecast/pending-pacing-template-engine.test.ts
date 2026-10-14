import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPendingPacingTemplateEngine } from "./pending-pacing-template-engine.js";
import { newPendingPacingTemplate } from "./pending-pacing-template.js";

test("PendingPacingTemplateEngine keeps results within bounds", () => {
  const engine = defaultPendingPacingTemplateEngine(flags.newRegistry());
  const item = newPendingPacingTemplate("code-190", "title-984");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
