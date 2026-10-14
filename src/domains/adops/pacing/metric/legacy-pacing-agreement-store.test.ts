import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacyPacingAgreementStore } from "./legacy-pacing-agreement-store.js";
import { newLegacyPacingAgreement } from "./legacy-pacing-agreement.js";

test("MemoryLegacyPacingAgreementStore finds what it saved", () => {
  const store = newMemoryLegacyPacingAgreementStore();
  const item = newLegacyPacingAgreement("code-88", "title-317");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
