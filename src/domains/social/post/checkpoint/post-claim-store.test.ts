import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPostClaimStore } from "./post-claim-store.js";
import { newPostClaim } from "./post-claim.js";

test("MemoryPostClaimStore finds what it saved", () => {
  const store = newMemoryPostClaimStore();
  const item = newPostClaim("code-308", "label-16");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
