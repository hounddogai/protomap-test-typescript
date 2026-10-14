import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryModelClaimStore } from "./model-claim-store.js";
import { newModelClaim } from "./model-claim.js";

test("MemoryModelClaimStore finds what it saved", () => {
  const store = newMemoryModelClaimStore();
  const item = newModelClaim("code-947", "name-105");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
