import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRegionalReplyAgreementStore } from "./regional-reply-agreement-store.js";
import { newRegionalReplyAgreement } from "./regional-reply-agreement.js";

test("MemoryRegionalReplyAgreementStore finds what it saved", () => {
  const store = newMemoryRegionalReplyAgreementStore();
  const item = newRegionalReplyAgreement("code-238", "title-769");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
