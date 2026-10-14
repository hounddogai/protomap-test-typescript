import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPacingAgreementStore } from "./pacing-agreement-store.js";
import { newPacingAgreement } from "./pacing-agreement.js";

test("MemoryPacingAgreementStore finds what it saved", () => {
  const store = newMemoryPacingAgreementStore();
  const item = newPacingAgreement("code-72", "label-164");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
