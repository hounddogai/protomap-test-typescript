import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryComplaintClaimStore } from "./complaint-claim-store.js";
import { newComplaintClaim } from "./complaint-claim.js";

test("MemoryComplaintClaimStore finds what it saved", () => {
  const store = newMemoryComplaintClaimStore();
  const item = newComplaintClaim("code-370", "title-379");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
