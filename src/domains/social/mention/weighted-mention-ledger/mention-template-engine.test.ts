import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultMentionTemplateEngine } from "./mention-template-engine.js";
import { newMentionTemplate } from "./mention-template.js";

test("MentionTemplateEngine keeps results within bounds", () => {
  const engine = defaultMentionTemplateEngine(flags.newRegistry());
  const item = newMentionTemplate("code-254", "name-925");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
