import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedJourneyAgreementStore } from "./weighted-journey-agreement-store.js";
import { newWeightedJourneyAgreement } from "./weighted-journey-agreement.js";

test("MemoryWeightedJourneyAgreementStore finds what it saved", () => {
  const store = newMemoryWeightedJourneyAgreementStore();
  const item = newWeightedJourneyAgreement("code-259", "title-146");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
