import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySenderClaimStore } from "./sender-claim-store.js";
import { newSenderClaim } from "./sender-claim.js";

test("MemorySenderClaimStore finds what it saved", () => {
  const store = newMemorySenderClaimStore();
  const item = newSenderClaim("code-295", "title-624");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
