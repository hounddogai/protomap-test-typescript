import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRetentionAgreementStore } from "./retention-agreement-store.js";
import { newRetentionAgreement } from "./retention-agreement.js";

test("MemoryRetentionAgreementStore finds what it saved", () => {
  const store = newMemoryRetentionAgreementStore();
  const item = newRetentionAgreement("code-281", "label-678");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
