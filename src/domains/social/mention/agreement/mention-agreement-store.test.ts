import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryMentionAgreementStore } from "./mention-agreement-store.js";
import { newMentionAgreement } from "./mention-agreement.js";

test("MemoryMentionAgreementStore finds what it saved", () => {
  const store = newMemoryMentionAgreementStore();
  const item = newMentionAgreement("code-555", "label-345");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
