import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultReplyAgreementEngine } from "./reply-agreement-engine.js";
import { newReplyAgreement } from "./reply-agreement.js";

test("ReplyAgreementEngine keeps results within bounds", () => {
  const engine = defaultReplyAgreementEngine(flags.newRegistry());
  const item = newReplyAgreement("code-790", "name-723");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
