import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultMentionAgreementEngine } from "./mention-agreement-engine.js";
import { newMentionAgreement } from "./mention-agreement.js";

test("MentionAgreementEngine keeps results within bounds", () => {
  const engine = defaultMentionAgreementEngine();
  const item = newMentionAgreement("code-555", "label-345");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
