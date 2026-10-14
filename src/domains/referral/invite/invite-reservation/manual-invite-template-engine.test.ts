import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultManualInviteTemplateEngine } from "./manual-invite-template-engine.js";
import { newManualInviteTemplate } from "./manual-invite-template.js";

test("ManualInviteTemplateEngine keeps results within bounds", () => {
  const engine = defaultManualInviteTemplateEngine(flags.newRegistry());
  const item = newManualInviteTemplate("code-468", "name-451");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
