import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPendingInsightAgreementStore } from "./pending-insight-agreement-store.js";
import { newPendingInsightAgreement } from "./pending-insight-agreement.js";

test("MemoryPendingInsightAgreementStore finds what it saved", () => {
  const store = newMemoryPendingInsightAgreementStore();
  const item = newPendingInsightAgreement("code-758", "title-150");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
