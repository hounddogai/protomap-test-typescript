import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySeasonalCreditAgreementStore } from "./seasonal-credit-agreement-store.js";
import { newSeasonalCreditAgreement } from "./seasonal-credit-agreement.js";

test("MemorySeasonalCreditAgreementStore finds what it saved", () => {
  const store = newMemorySeasonalCreditAgreementStore();
  const item = newSeasonalCreditAgreement("code-832", "name-817");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
