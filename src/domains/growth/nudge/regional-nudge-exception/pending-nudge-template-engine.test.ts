import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPendingNudgeTemplateEngine } from "./pending-nudge-template-engine.js";
import { newPendingNudgeTemplate } from "./pending-nudge-template.js";

test("PendingNudgeTemplateEngine keeps results within bounds", () => {
  const engine = defaultPendingNudgeTemplateEngine();
  const item = newPendingNudgeTemplate("code-320", "title-974");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
