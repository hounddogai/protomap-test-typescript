import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedJourneyPolicyStore } from "./batched-journey-policy-store.js";
import { newBatchedJourneyPolicy } from "./batched-journey-policy.js";

test("MemoryBatchedJourneyPolicyStore finds what it saved", () => {
  const store = newMemoryBatchedJourneyPolicyStore();
  const item = newBatchedJourneyPolicy("code-163", "title-543");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
