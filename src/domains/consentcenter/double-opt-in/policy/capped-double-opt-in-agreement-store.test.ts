import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCappedDoubleOptInAgreementStore } from "./capped-double-opt-in-agreement-store.js";
import { newCappedDoubleOptInAgreement } from "./capped-double-opt-in-agreement.js";

test("MemoryCappedDoubleOptInAgreementStore finds what it saved", () => {
  const store = newMemoryCappedDoubleOptInAgreementStore();
  const item = newCappedDoubleOptInAgreement("code-109", "title-70");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
