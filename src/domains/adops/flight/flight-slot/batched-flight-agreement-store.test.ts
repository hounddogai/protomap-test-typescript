import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedFlightAgreementStore } from "./batched-flight-agreement-store.js";
import { newBatchedFlightAgreement } from "./batched-flight-agreement.js";

test("MemoryBatchedFlightAgreementStore finds what it saved", () => {
  const store = newMemoryBatchedFlightAgreementStore();
  const item = newBatchedFlightAgreement("code-665", "name-831");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
