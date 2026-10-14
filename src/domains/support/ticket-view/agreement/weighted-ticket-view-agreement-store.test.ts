import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedTicketViewAgreementStore } from "./weighted-ticket-view-agreement-store.js";
import { newWeightedTicketViewAgreement } from "./weighted-ticket-view-agreement.js";

test("MemoryWeightedTicketViewAgreementStore finds what it saved", () => {
  const store = newMemoryWeightedTicketViewAgreementStore();
  const item = newWeightedTicketViewAgreement("code-237", "title-363");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
