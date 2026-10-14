import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientPathClaimStore } from "./lenient-path-claim-store.js";
import { newLenientPathClaim } from "./lenient-path-claim.js";

test("MemoryLenientPathClaimStore finds what it saved", () => {
  const store = newMemoryLenientPathClaimStore();
  const item = newLenientPathClaim("code-157", "name-35");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
