import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRegionalCsatClaimStore } from "./regional-csat-claim-store.js";
import { newRegionalCsatClaim } from "./regional-csat-claim.js";

test("MemoryRegionalCsatClaimStore finds what it saved", () => {
  const store = newMemoryRegionalCsatClaimStore();
  const item = newRegionalCsatClaim("code-170", "name-675");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
