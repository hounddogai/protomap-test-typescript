import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryModelAgreementStore } from "./model-agreement-store.js";
import { newModelAgreement } from "./model-agreement.js";

test("MemoryModelAgreementStore finds what it saved", () => {
  const store = newMemoryModelAgreementStore();
  const item = newModelAgreement("code-583", "title-98");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
