import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingJourneyAgreementStore } from "./rolling-journey-agreement-store.js";
import { newRollingJourneyAgreement } from "./rolling-journey-agreement.js";

test("MemoryRollingJourneyAgreementStore finds what it saved", () => {
  const store = newMemoryRollingJourneyAgreementStore();
  const item = newRollingJourneyAgreement("code-666", "title-296");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
