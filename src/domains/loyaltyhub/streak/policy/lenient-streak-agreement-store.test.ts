import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientStreakAgreementStore } from "./lenient-streak-agreement-store.js";
import { newLenientStreakAgreement } from "./lenient-streak-agreement.js";

test("MemoryLenientStreakAgreementStore finds what it saved", () => {
  const store = newMemoryLenientStreakAgreementStore();
  const item = newLenientStreakAgreement("code-107", "label-968");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
