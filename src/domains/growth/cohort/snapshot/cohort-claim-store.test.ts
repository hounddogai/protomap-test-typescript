import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCohortClaimStore } from "./cohort-claim-store.js";
import { newCohortClaim } from "./cohort-claim.js";

test("MemoryCohortClaimStore finds what it saved", () => {
  const store = newMemoryCohortClaimStore();
  const item = newCohortClaim("code-995", "title-731");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
