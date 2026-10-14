import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientJourneyPolicyStore } from "./lenient-journey-policy-store.js";
import { newLenientJourneyPolicy } from "./lenient-journey-policy.js";

test("MemoryLenientJourneyPolicyStore finds what it saved", () => {
  const store = newMemoryLenientJourneyPolicyStore();
  const item = newLenientJourneyPolicy("code-357", "label-701");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
