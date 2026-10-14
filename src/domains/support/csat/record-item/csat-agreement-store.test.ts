import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCsatAgreementStore } from "./csat-agreement-store.js";
import { newCsatAgreement } from "./csat-agreement.js";

test("MemoryCsatAgreementStore finds what it saved", () => {
  const store = newMemoryCsatAgreementStore();
  const item = newCsatAgreement("code-115", "label-497");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
