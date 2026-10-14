import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredMacroAgreementStore } from "./tiered-macro-agreement-store.js";
import { newTieredMacroAgreement } from "./tiered-macro-agreement.js";

test("MemoryTieredMacroAgreementStore finds what it saved", () => {
  const store = newMemoryTieredMacroAgreementStore();
  const item = newTieredMacroAgreement("code-614", "title-344");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
