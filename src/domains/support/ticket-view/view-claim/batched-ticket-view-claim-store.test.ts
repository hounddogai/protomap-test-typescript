import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedTicketViewClaimStore } from "./batched-ticket-view-claim-store.js";
import { newBatchedTicketViewClaim } from "./batched-ticket-view-claim.js";

test("MemoryBatchedTicketViewClaimStore finds what it saved", () => {
  const store = newMemoryBatchedTicketViewClaimStore();
  const item = newBatchedTicketViewClaim("code-215", "title-323");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
