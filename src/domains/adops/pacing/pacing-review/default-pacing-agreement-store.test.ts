import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDefaultPacingAgreementStore } from "./default-pacing-agreement-store.js";
import { newDefaultPacingAgreement } from "./default-pacing-agreement.js";

test("MemoryDefaultPacingAgreementStore finds what it saved", () => {
  const store = newMemoryDefaultPacingAgreementStore();
  const item = newDefaultPacingAgreement("code-26", "label-201");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
