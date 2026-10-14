import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySenderAgreementStore } from "./sender-agreement-store.js";
import { newSenderAgreement } from "./sender-agreement.js";

test("MemorySenderAgreementStore finds what it saved", () => {
  const store = newMemorySenderAgreementStore();
  const item = newSenderAgreement("code-379", "title-183");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
