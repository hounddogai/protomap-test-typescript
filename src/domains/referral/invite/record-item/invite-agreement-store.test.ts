import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryInviteAgreementStore } from "./invite-agreement-store.js";
import { newInviteAgreement } from "./invite-agreement.js";

test("MemoryInviteAgreementStore finds what it saved", () => {
  const store = newMemoryInviteAgreementStore();
  const item = newInviteAgreement("code-59", "label-588");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
