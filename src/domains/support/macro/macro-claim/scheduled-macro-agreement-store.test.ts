import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryScheduledMacroAgreementStore } from "./scheduled-macro-agreement-store.js";
import { newScheduledMacroAgreement } from "./scheduled-macro-agreement.js";

test("MemoryScheduledMacroAgreementStore finds what it saved", () => {
  const store = newMemoryScheduledMacroAgreementStore();
  const item = newScheduledMacroAgreement("code-536", "label-347");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
