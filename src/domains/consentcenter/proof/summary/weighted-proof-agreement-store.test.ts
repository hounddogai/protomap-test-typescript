import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedProofAgreementStore } from "./weighted-proof-agreement-store.js";
import { newWeightedProofAgreement } from "./weighted-proof-agreement.js";

test("MemoryWeightedProofAgreementStore finds what it saved", () => {
  const store = newMemoryWeightedProofAgreementStore();
  const item = newWeightedProofAgreement("code-828", "label-866");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
