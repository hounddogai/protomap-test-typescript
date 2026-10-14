import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredTicketViewClaimStore } from "./tiered-ticket-view-claim-store.js";
import { newTieredTicketViewClaim } from "./tiered-ticket-view-claim.js";

test("MemoryTieredTicketViewClaimStore finds what it saved", () => {
  const store = newMemoryTieredTicketViewClaimStore();
  const item = newTieredTicketViewClaim("code-256", "title-653");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
