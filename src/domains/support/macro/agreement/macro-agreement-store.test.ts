import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryMacroAgreementStore } from "./macro-agreement-store.js";
import { newMacroAgreement } from "./macro-agreement.js";

test("MemoryMacroAgreementStore finds what it saved", () => {
  const store = newMemoryMacroAgreementStore();
  const item = newMacroAgreement("code-440", "title-844");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
