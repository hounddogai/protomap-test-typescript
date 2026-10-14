import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedFunnelAgreementStore } from "./batched-funnel-agreement-store.js";
import { newBatchedFunnelAgreement } from "./batched-funnel-agreement.js";

test("MemoryBatchedFunnelAgreementStore finds what it saved", () => {
  const store = newMemoryBatchedFunnelAgreementStore();
  const item = newBatchedFunnelAgreement("code-875", "title-412");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
