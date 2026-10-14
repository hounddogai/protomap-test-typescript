import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedOptOutAgreementStore } from "./weighted-opt-out-agreement-store.js";
import { newWeightedOptOutAgreement } from "./weighted-opt-out-agreement.js";

test("MemoryWeightedOptOutAgreementStore finds what it saved", () => {
  const store = newMemoryWeightedOptOutAgreementStore();
  const item = newWeightedOptOutAgreement("code-611", "title-343");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
