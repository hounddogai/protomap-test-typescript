import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptiveTicketViewClaimStore } from "./adaptive-ticket-view-claim-store.js";
import { newAdaptiveTicketViewClaim } from "./adaptive-ticket-view-claim.js";

test("MemoryAdaptiveTicketViewClaimStore finds what it saved", () => {
  const store = newMemoryAdaptiveTicketViewClaimStore();
  const item = newAdaptiveTicketViewClaim("code-596", "label-607");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
