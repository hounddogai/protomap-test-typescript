import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPrimarySenderAgreementStore } from "./primary-sender-agreement-store.js";
import { newPrimarySenderAgreement } from "./primary-sender-agreement.js";

test("MemoryPrimarySenderAgreementStore finds what it saved", () => {
  const store = newMemoryPrimarySenderAgreementStore();
  const item = newPrimarySenderAgreement("code-690", "name-189");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
