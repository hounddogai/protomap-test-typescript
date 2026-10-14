import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryManualStreakAgreementStore } from "./manual-streak-agreement-store.js";
import { newManualStreakAgreement } from "./manual-streak-agreement.js";

test("MemoryManualStreakAgreementStore finds what it saved", () => {
  const store = newMemoryManualStreakAgreementStore();
  const item = newManualStreakAgreement("code-522", "title-139");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
