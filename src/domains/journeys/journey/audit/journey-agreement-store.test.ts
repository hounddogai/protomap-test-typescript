import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryJourneyAgreementStore } from "./journey-agreement-store.js";
import { newJourneyAgreement } from "./journey-agreement.js";

test("MemoryJourneyAgreementStore finds what it saved", () => {
  const store = newMemoryJourneyAgreementStore();
  const item = newJourneyAgreement("code-295", "title-381");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
