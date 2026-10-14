import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultEscalationAgreementEngine } from "./escalation-agreement-engine.js";
import { newEscalationAgreement } from "./escalation-agreement.js";

test("EscalationAgreementEngine keeps results within bounds", () => {
  const engine = defaultEscalationAgreementEngine(flags.newRegistry());
  const item = newEscalationAgreement("code-139", "title-899");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
