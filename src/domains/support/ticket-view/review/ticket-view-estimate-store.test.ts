import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTicketViewEstimateStore } from "./ticket-view-estimate-store.js";
import { newTicketViewEstimate } from "./ticket-view-estimate.js";

test("MemoryTicketViewEstimateStore finds what it saved", () => {
  const store = newMemoryTicketViewEstimateStore();
  const item = newTicketViewEstimate("code-104", "name-731");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
