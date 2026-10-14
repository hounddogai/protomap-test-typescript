import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySuppressionAgreementStore } from "./suppression-agreement-store.js";
import { newSuppressionAgreement } from "./suppression-agreement.js";

test("MemorySuppressionAgreementStore finds what it saved", () => {
  const store = newMemorySuppressionAgreementStore();
  const item = newSuppressionAgreement("code-833", "name-378");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
