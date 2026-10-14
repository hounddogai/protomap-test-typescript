import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPendingProofAgreementStore } from "./pending-proof-agreement-store.js";
import { newPendingProofAgreement } from "./pending-proof-agreement.js";

test("MemoryPendingProofAgreementStore finds what it saved", () => {
  const store = newMemoryPendingProofAgreementStore();
  const item = newPendingProofAgreement("code-565", "name-400");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
