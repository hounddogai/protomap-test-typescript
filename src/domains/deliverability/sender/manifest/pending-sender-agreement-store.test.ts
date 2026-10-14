import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPendingSenderAgreementStore } from "./pending-sender-agreement-store.js";
import { newPendingSenderAgreement } from "./pending-sender-agreement.js";

test("MemoryPendingSenderAgreementStore finds what it saved", () => {
  const store = newMemoryPendingSenderAgreementStore();
  const item = newPendingSenderAgreement("code-650", "label-915");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
