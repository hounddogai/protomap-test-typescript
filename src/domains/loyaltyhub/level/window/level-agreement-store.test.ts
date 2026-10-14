import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLevelAgreementStore } from "./level-agreement-store.js";
import { newLevelAgreement } from "./level-agreement.js";

test("MemoryLevelAgreementStore finds what it saved", () => {
  const store = newMemoryLevelAgreementStore();
  const item = newLevelAgreement("code-825", "label-767");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
