import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedTicketViewDigestStore } from "./weighted-ticket-view-digest-store.js";
import { newWeightedTicketViewDigest } from "./weighted-ticket-view-digest.js";

test("MemoryWeightedTicketViewDigestStore finds what it saved", () => {
  const store = newMemoryWeightedTicketViewDigestStore();
  const item = newWeightedTicketViewDigest("code-43", "name-986");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
