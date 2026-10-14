import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTicketViewClaimStore } from "./ticket-view-claim-store.js";
import { newTicketViewClaim } from "./ticket-view-claim.js";

test("MemoryTicketViewClaimStore finds what it saved", () => {
  const store = newMemoryTicketViewClaimStore();
  const item = newTicketViewClaim("code-846", "name-765");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
