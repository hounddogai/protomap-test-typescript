import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWindowClaimStore } from "./window-claim-store.js";
import { newWindowClaim } from "./window-claim.js";

test("MemoryWindowClaimStore finds what it saved", () => {
  const store = newMemoryWindowClaimStore();
  const item = newWindowClaim("code-180", "title-907");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
