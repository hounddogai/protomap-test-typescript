import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRegionalCohortClaimStore } from "./regional-cohort-claim-store.js";
import { newRegionalCohortClaim } from "./regional-cohort-claim.js";

test("MemoryRegionalCohortClaimStore finds what it saved", () => {
  const store = newMemoryRegionalCohortClaimStore();
  const item = newRegionalCohortClaim("code-858", "title-911");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
