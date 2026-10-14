import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWindowAgreementStore } from "./window-agreement-store.js";
import { newWindowAgreement } from "./window-agreement.js";

test("MemoryWindowAgreementStore finds what it saved", () => {
  const store = newMemoryWindowAgreementStore();
  const item = newWindowAgreement("code-563", "name-152");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
