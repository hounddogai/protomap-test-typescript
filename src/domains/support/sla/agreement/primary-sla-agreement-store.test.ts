import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPrimarySlaAgreementStore } from "./primary-sla-agreement-store.js";
import { newPrimarySlaAgreement } from "./primary-sla-agreement.js";

test("MemoryPrimarySlaAgreementStore finds what it saved", () => {
  const store = newMemoryPrimarySlaAgreementStore();
  const item = newPrimarySlaAgreement("code-457", "title-144");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
