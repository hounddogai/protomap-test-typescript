import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultInviteAgreementEngine } from "./invite-agreement-engine.js";
import { newInviteAgreement } from "./invite-agreement.js";

test("InviteAgreementEngine keeps results within bounds", () => {
  const engine = defaultInviteAgreementEngine();
  const item = newInviteAgreement("code-59", "label-588");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
