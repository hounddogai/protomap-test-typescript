import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacyCohortClaimStore } from "./legacy-cohort-claim-store.js";
import { newLegacyCohortClaim } from "./legacy-cohort-claim.js";

test("MemoryLegacyCohortClaimStore finds what it saved", () => {
  const store = newMemoryLegacyCohortClaimStore();
  const item = newLegacyCohortClaim("code-193", "title-630");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
