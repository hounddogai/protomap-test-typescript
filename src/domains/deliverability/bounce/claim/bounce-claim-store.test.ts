import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBounceClaimStore } from "./bounce-claim-store.js";
import { newBounceClaim } from "./bounce-claim.js";

test("MemoryBounceClaimStore finds what it saved", () => {
  const store = newMemoryBounceClaimStore();
  const item = newBounceClaim("code-461", "title-797");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
