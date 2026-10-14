import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryManualRetentionAgreementStore } from "./manual-retention-agreement-store.js";
import { newManualRetentionAgreement } from "./manual-retention-agreement.js";

test("MemoryManualRetentionAgreementStore finds what it saved", () => {
  const store = newMemoryManualRetentionAgreementStore();
  const item = newManualRetentionAgreement("code-894", "name-806");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
