import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryEscalationAgreementStore } from "./escalation-agreement-store.js";
import { newEscalationAgreement } from "./escalation-agreement.js";

test("MemoryEscalationAgreementStore finds what it saved", () => {
  const store = newMemoryEscalationAgreementStore();
  const item = newEscalationAgreement("code-139", "title-899");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
