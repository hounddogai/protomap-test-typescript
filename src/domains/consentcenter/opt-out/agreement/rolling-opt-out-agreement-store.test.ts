import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingOptOutAgreementStore } from "./rolling-opt-out-agreement-store.js";
import { newRollingOptOutAgreement } from "./rolling-opt-out-agreement.js";

test("MemoryRollingOptOutAgreementStore finds what it saved", () => {
  const store = newMemoryRollingOptOutAgreementStore();
  const item = newRollingOptOutAgreement("code-514", "label-148");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
