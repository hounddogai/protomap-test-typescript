import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRegionalChallengeAgreementStore } from "./regional-challenge-agreement-store.js";
import { newRegionalChallengeAgreement } from "./regional-challenge-agreement.js";

test("MemoryRegionalChallengeAgreementStore finds what it saved", () => {
  const store = newMemoryRegionalChallengeAgreementStore();
  const item = newRegionalChallengeAgreement("code-840", "name-568");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
