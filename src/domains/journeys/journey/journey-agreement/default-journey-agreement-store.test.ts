import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDefaultJourneyAgreementStore } from "./default-journey-agreement-store.js";
import { newDefaultJourneyAgreement } from "./default-journey-agreement.js";

test("MemoryDefaultJourneyAgreementStore finds what it saved", () => {
  const store = newMemoryDefaultJourneyAgreementStore();
  const item = newDefaultJourneyAgreement("code-406", "name-938");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
